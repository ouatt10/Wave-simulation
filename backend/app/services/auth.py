from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import AppError
from app.core.security import hash_secret
from app.models import User
from app.services import lockout, otp


def _get_by_phone(db: Session, phone: str, *, for_update: bool = False) -> User | None:
    query = select(User).where(User.phone == phone)
    if for_update:
        query = query.with_for_update().execution_options(populate_existing=True)
    return db.scalars(query).first()


def register(db: Session, phone: str, pin: str) -> User:
    """Crée le compte (ou remplace le PIN d'un compte jamais vérifié) et envoie un OTP."""
    user = _get_by_phone(db, phone, for_update=True)
    if user is not None and user.phone_verified:
        raise AppError(409, "phone_taken", "Ce numéro a déjà un compte. Connecte-toi.")

    if user is None:
        user = User(phone=phone, pin_hash=hash_secret(pin))
        db.add(user)
        db.flush()
    else:
        user.pin_hash = hash_secret(pin)

    otp.send_otp(db, user, utcnow())
    db.commit()
    return user


def _get_unverified(db: Session, phone: str) -> User:
    user = _get_by_phone(db, phone, for_update=True)
    if user is None:
        raise AppError(404, "unknown_phone", "Aucune inscription en cours pour ce numéro.")
    if user.phone_verified:
        raise AppError(409, "already_verified", "Ce numéro est déjà vérifié. Connecte-toi.")
    return user


def resend_otp(db: Session, phone: str) -> User:
    user = _get_unverified(db, phone)
    otp.send_otp(db, user, utcnow())
    db.commit()
    return user


def verify_otp(db: Session, phone: str, code: str) -> User:
    user = _get_unverified(db, phone)
    otp.check_otp(db, user, code, utcnow())
    user.phone_verified = True
    db.commit()
    return user


def login(db: Session, phone: str, pin: str) -> User:
    user = _get_by_phone(db, phone, for_update=True)
    if user is None:
        raise AppError(401, "invalid_credentials", "Numéro ou code PIN incorrect.")
    if not user.phone_verified:
        raise AppError(403, "phone_not_verified", "Ce numéro n'a pas encore été vérifié.")

    lockout.check_pin(db, user, pin, utcnow())
    db.commit()
    return user


def change_pin(db: Session, user: User, current_pin: str, new_pin: str) -> None:
    """Le PIN actuel passe par le blocage progressif, comme à la connexion."""
    user = _get_by_phone(db, user.phone, for_update=True)
    lockout.check_pin(db, user, current_pin, utcnow())
    if current_pin == new_pin:
        raise AppError(400, "same_pin", "Le nouveau code doit être différent de l'ancien.")
    user.pin_hash = hash_secret(new_pin)
    db.commit()
