from fastapi import APIRouter

from app.aws import cognito
from app.schemas.common import LoginRequest, SignupRequest, VerifyRequest, AuthResponse, MessageResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=MessageResponse)
def signup(payload: SignupRequest):
    cognito.sign_up(payload.email, payload.password, payload.name)
    return MessageResponse(message="Verification code sent to your email")


@router.post("/verify", response_model=MessageResponse)
def verify(payload: VerifyRequest):
    cognito.confirm_sign_up(payload.email, payload.code)
    return MessageResponse(message="Email verified — you can now sign in")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    token = cognito.login(payload.email, payload.password)
    return AuthResponse(token=token, email=payload.email, name=payload.email.split("@")[0])
