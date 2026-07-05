import logging

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings
from app.db import models

logger = logging.getLogger(__name__)


def get_session(account: models.AwsAccount) -> boto3.Session:
    """Assume the account's cross-account role. Falls back to the platform's own
    credentials ONLY for the platform's own demo account ID — so a public visitor
    typing an arbitrary role ARN for a different account gets a clear failure
    instead of silently scanning the platform's real AWS resources."""
    sts = boto3.client("sts")
    try:
        creds = sts.assume_role(
            RoleArn=account.role_arn,
            RoleSessionName="cloudclean-scan",
            ExternalId=account.external_id,
        )["Credentials"]
        return boto3.Session(
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
        )
    except ClientError as e:
        if settings.platform_aws_account_id and account.aws_account_id == settings.platform_aws_account_id:
            logger.warning("Could not assume %s (%s) — falling back to platform credentials (demo account)", account.role_arn, e)
            return boto3.Session()
        logger.warning("Could not assume %s for account %s: %s", account.role_arn, account.aws_account_id, e)
        raise
