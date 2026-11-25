"""Outil de développement : lister les comptes ou remettre un code secret à zéro.

    python -m scripts.reset_pin                       → liste les comptes
    python -m scripts.reset_pin +2250700000001 1234   → nouveau code 1234, compte débloqué
"""

import re
import sys

from sqlalchemy import select

from app.core.security import hash_secret
from app.db.session import SessionLocal
from app.models import User


def main(args: list[str]) -> None:
    with SessionLocal() as db:
        if not args:
            for user in db.scalars(select(User).order_by(User.created_at)):
                print(f"{user.phone}  {user.full_name or '(sans KYC)'}  solde : {user.balance} F")
            return

        phone, pin = args
        if not re.fullmatch(r"\d{4}", pin):
            sys.exit("Le code secret doit faire 4 chiffres.")
        user = db.scalars(select(User).where(User.phone == phone)).first()
        if user is None:
            sys.exit(f"Aucun compte pour {phone}.")
        user.pin_hash = hash_secret(pin)
        user.failed_pin_attempts = 0
        user.lock_level = 0
        user.locked_until = None
        db.commit()
        print(f"Code secret de {phone} changé, compte débloqué.")


if __name__ == "__main__":
    main(sys.argv[1:])
