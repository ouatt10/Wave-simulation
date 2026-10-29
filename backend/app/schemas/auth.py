from pydantic import BaseModel

from app.schemas.fields import OtpCode, Phone, Pin


class RegisterIn(BaseModel):
    phone: Phone
    pin: Pin


class PhoneIn(BaseModel):
    phone: Phone


class OtpVerifyIn(BaseModel):
    phone: Phone
    code: OtpCode


class LoginIn(BaseModel):
    phone: Phone
    pin: Pin


class OtpSentOut(BaseModel):
    phone: str
    expires_in: int
    resend_in: int


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    kyc_required: bool
