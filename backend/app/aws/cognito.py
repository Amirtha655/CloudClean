import base64
import hashlib
import hmac

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException

from app.core.config import settings

_client = boto3.client("cognito-idp", region_name=settings.aws_region)


def _secret_hash(username: str) -> str:
    message = username + settings.cognito_app_client_id
    digest = hmac.new(
        settings.cognito_app_client_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.b64encode(digest).decode()


def sign_up(email: str, password: str, name: str) -> None:
    try:
        _client.sign_up(
            ClientId=settings.cognito_app_client_id,
            SecretHash=_secret_hash(email),
            Username=email,
            Password=password,
            UserAttributes=[{"Name": "email", "Value": email}, {"Name": "name", "Value": name}],
        )
    except _client.exceptions.UsernameExistsException:
        raise HTTPException(409, "An account with this email already exists")
    except _client.exceptions.InvalidPasswordException as e:
        raise HTTPException(400, f"Password does not meet requirements: {e}")
    except ClientError as e:
        raise HTTPException(400, str(e))


def confirm_sign_up(email: str, code: str) -> None:
    try:
        _client.confirm_sign_up(
            ClientId=settings.cognito_app_client_id,
            SecretHash=_secret_hash(email),
            Username=email,
            ConfirmationCode=code,
        )
    except _client.exceptions.CodeMismatchException:
        raise HTTPException(400, "Incorrect verification code")
    except _client.exceptions.ExpiredCodeException:
        raise HTTPException(400, "Verification code expired — request a new one")
    except ClientError as e:
        raise HTTPException(400, str(e))


def login(email: str, password: str) -> str:
    try:
        resp = _client.initiate_auth(
            ClientId=settings.cognito_app_client_id,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": password,
                "SECRET_HASH": _secret_hash(email),
            },
        )
        # AccessToken (not IdToken) is what get_user() accepts — used as our bearer token.
        return resp["AuthenticationResult"]["AccessToken"]
    except _client.exceptions.UserNotConfirmedException:
        raise HTTPException(403, "Please verify your email before signing in")
    except _client.exceptions.NotAuthorizedException:
        raise HTTPException(401, "Incorrect email or password")
    except _client.exceptions.UserNotFoundException:
        raise HTTPException(401, "Incorrect email or password")
    except ClientError as e:
        raise HTTPException(400, str(e))


def get_user(access_token: str) -> dict:
    """Validates the bearer token against Cognito and returns {sub, email, name}."""
    try:
        resp = _client.get_user(AccessToken=access_token)
    except (_client.exceptions.NotAuthorizedException, _client.exceptions.UserNotFoundException):
        raise HTTPException(401, "Invalid or expired session")
    except ClientError as e:
        raise HTTPException(401, str(e))

    attrs = {a["Name"]: a["Value"] for a in resp["UserAttributes"]}
    return {"sub": attrs["sub"], "email": attrs["email"], "name": attrs.get("name", "")}
