import math
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.rules import LOCK_DELAYS, MAX_PIN_ATTEMPTS
from app.core.security import verify_secret
from app.models import User


def _locked_error(seconds: float) -> AppError:
    return AppError(
        423,
        "account_locked",
        "Trop d'essais incorrects. Réessaie plus tard.",
        retry_after=math.ceil(seconds),
    )


def check_pin(db: Session, user: User, pin: str, now: datetime) -> None:
    """Vérifie le PIN en appliquant le blocage progressif.

    `user` doit être verrouillé (SELECT … FOR UPDATE) par l'appelant pour que
    deux essais simultanés ne faussent pas le compteur. En cas d'échec, le
    compteur est enregistré (commit) avant de lever l'erreur.
    """
    if user.locked_until is not None and user.locked_until > now:
        raise _locked_error((user.locked_until - now).total_seconds())

    if verify_secret(pin, user.pin_hash):
        user.failed_pin_attempts = 0
        user.lock_level = 0
        user.locked_until = None
        return

    user.failed_pin_attempts += 1
    # Avant le premier blocage on tolère 3 erreurs ; ensuite chaque erreur rebloque.
    threshold = MAX_PIN_ATTEMPTS if user.lock_level == 0 else 1

    if user.failed_pin_attempts < threshold:
        remaining = threshold - user.failed_pin_attempts
        db.commit()
        raise AppError(401, "invalid_pin", "Code PIN incorrect.", attempts_remaining=remaining)

    delay = LOCK_DELAYS[min(user.lock_level, len(LOCK_DELAYS) - 1)]
    user.locked_until = now + delay
    user.lock_level += 1
    user.failed_pin_attempts = 0
    db.commit()
    raise _locked_error(delay.total_seconds())
