import math
import secrets
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.rules import OTP_MAX_ATTEMPTS, OTP_RESEND_DELAY, OTP_TTL
from app.core.security import hash_secret, verify_secret
from app.models import OtpCode, User


def generate_code() -> str:
    return f"{secrets.randbelow(10**6):06d}"


def _latest(db: Session, user: User) -> OtpCode | None:
    return db.scalars(
        select(OtpCode)
        .where(OtpCode.user_id == user.id)
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    ).first()


def send_otp(db: Session, user: User, now: datetime) -> None:
    """Crée un nouveau code (l'ancien devient inutilisable) et « l'envoie » dans la console."""
    last = _latest(db, user)
    if last is not None:
        wait = (last.created_at + OTP_RESEND_DELAY - now).total_seconds()
        if wait > 0:
            raise AppError(
                429,
                "otp_cooldown",
                "Patiente avant de demander un nouveau code.",
                retry_after=math.ceil(wait),
            )

    code = generate_code()
    db.add(
        OtpCode(
            user_id=user.id,
            code_hash=hash_secret(code),
            expires_at=now + OTP_TTL,
            created_at=now,
        )
    )
    print(f"\n{'=' * 40}\n  SMS simulé → {user.phone}\n  Code WAVE : {code}\n{'=' * 40}\n", flush=True)


def check_otp(db: Session, user: User, code: str, now: datetime) -> None:
    """Valide le dernier code envoyé. Un code faux est comptabilisé immédiatement."""
    otp = _latest(db, user)
    if (
        otp is None
        or otp.consumed_at is not None
        or otp.expires_at <= now
        or otp.attempts >= OTP_MAX_ATTEMPTS
    ):
        raise AppError(400, "otp_expired", "Ce code a expiré. Demande un nouveau code.")

    if not verify_secret(code, otp.code_hash):
        otp.attempts += 1
        remaining = OTP_MAX_ATTEMPTS - otp.attempts
        db.commit()
        raise AppError(400, "otp_invalid", "Code incorrect.", attempts_remaining=remaining)

    otp.consumed_at = now
