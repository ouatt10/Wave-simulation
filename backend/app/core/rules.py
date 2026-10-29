"""Règles métier de la simulation (montants en FCFA, entiers)."""

from datetime import timedelta

MIN_AMOUNT = 100
MAX_AMOUNT = 1_500_000
TRANSFER_FEE_PERCENT = 1

OTP_TTL = timedelta(minutes=5)
OTP_RESEND_DELAY = timedelta(seconds=60)
OTP_MAX_ATTEMPTS = 5

# 3 PIN faux → 1er blocage ; ensuite chaque échec bloque, avec un délai croissant.
MAX_PIN_ATTEMPTS = 3
LOCK_DELAYS = [
    timedelta(minutes=1),
    timedelta(minutes=5),
    timedelta(minutes=15),
    timedelta(hours=1),
]

MIN_AGE_YEARS = 18
MAX_ID_PHOTO_BYTES = 5 * 1024 * 1024


def compute_fee(amount: int) -> int:
    """Frais de transfert : 1 % arrondi au franc supérieur."""
    return -(-amount * TRANSFER_FEE_PERCENT // 100)
