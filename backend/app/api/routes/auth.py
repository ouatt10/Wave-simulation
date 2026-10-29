from fastapi import APIRouter, status

from app.api.deps import DbSession
from app.core.config import settings
from app.core.rules import OTP_RESEND_DELAY, OTP_TTL
from app.core.security import create_access_token
from app.models import User
from app.schemas.auth import LoginIn, OtpSentOut, OtpVerifyIn, PhoneIn, RegisterIn, TokenOut
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _otp_sent(user: User) -> OtpSentOut:
    return OtpSentOut(
        phone=user.phone,
        expires_in=int(OTP_TTL.total_seconds()),
        resend_in=int(OTP_RESEND_DELAY.total_seconds()),
    )


def _token(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id),
        expires_in=settings.jwt_expire_minutes * 60,
        kyc_required=user.identity is None,
    )


@router.post("/register", status_code=status.HTTP_202_ACCEPTED)
def register(body: RegisterIn, db: DbSession) -> OtpSentOut:
    return _otp_sent(auth_service.register(db, body.phone, body.pin))


@router.post("/otp/resend", status_code=status.HTTP_202_ACCEPTED)
def resend_otp(body: PhoneIn, db: DbSession) -> OtpSentOut:
    return _otp_sent(auth_service.resend_otp(db, body.phone))


@router.post("/otp/verify")
def verify_otp(body: OtpVerifyIn, db: DbSession) -> TokenOut:
    return _token(auth_service.verify_otp(db, body.phone, body.code))


@router.post("/login")
def login(body: LoginIn, db: DbSession) -> TokenOut:
    return _token(auth_service.login(db, body.phone, body.pin))
