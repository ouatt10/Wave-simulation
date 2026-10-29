import secrets
import uuid

from sqlalchemy import or_, select, tuple_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import AppError
from app.core.rules import compute_fee
from app.models import Identity, Transaction, TransactionType, User
from app.services import lockout

_REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _new_reference() -> str:
    return "WV-" + "".join(secrets.choice(_REFERENCE_ALPHABET) for _ in range(8))


def _lock_users(db: Session, *user_ids: uuid.UUID) -> None:
    """Verrouille les comptes, toujours dans l'ordre des id pour éviter les interblocages."""
    db.scalars(
        select(User)
        .where(User.id.in_(user_ids))
        .order_by(User.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    ).all()


def _replay(db: Session, key: uuid.UUID, user: User, type_: TransactionType) -> Transaction | None:
    """Renvoie l'opération déjà faite avec cette clé (double clic, réseau coupé…)."""
    existing = db.scalars(select(Transaction).where(Transaction.idempotency_key == key)).first()
    if existing is None:
        return None
    owner_id = existing.receiver_id if type_ is TransactionType.DEPOSIT else existing.sender_id
    if existing.type is not type_ or owner_id != user.id:
        raise AppError(409, "idempotency_conflict", "Cette clé a déjà servi pour une autre opération.")
    return existing


def _commit(db: Session, tx: Transaction, user: User, type_: TransactionType) -> Transaction:
    try:
        db.commit()
        return tx
    except IntegrityError:
        # Une requête identique envoyée en parallèle est passée juste avant.
        db.rollback()
        existing = _replay(db, tx.idempotency_key, user, type_)
        if existing is None:
            raise
        return existing


def find_recipient(db: Session, sender: User, phone: str) -> User:
    if phone == sender.phone:
        raise AppError(400, "self_transfer", "Tu ne peux pas t'envoyer de l'argent à toi-même.")
    recipient = db.scalars(
        select(User).join(Identity).where(User.phone == phone, User.phone_verified)
    ).first()
    if recipient is None:
        raise AppError(404, "recipient_not_found", "Aucun compte WAVE actif pour ce numéro.")
    return recipient


def deposit(db: Session, user: User, amount: int, key: uuid.UUID) -> Transaction:
    if (existing := _replay(db, key, user, TransactionType.DEPOSIT)) is not None:
        return existing

    _lock_users(db, user.id)
    user.balance += amount
    tx = Transaction(
        reference=_new_reference(),
        type=TransactionType.DEPOSIT,
        receiver_id=user.id,
        amount=amount,
        fee=0,
        idempotency_key=key,
        created_at=utcnow(),
    )
    db.add(tx)
    return _commit(db, tx, user, TransactionType.DEPOSIT)


def transfer(
    db: Session, sender: User, to_phone: str, amount: int, pin: str, key: uuid.UUID
) -> Transaction:
    if (existing := _replay(db, key, sender, TransactionType.TRANSFER)) is not None:
        return existing

    recipient = find_recipient(db, sender, to_phone)
    _lock_users(db, sender.id, recipient.id)
    lockout.check_pin(db, sender, pin, utcnow())

    fee = compute_fee(amount)
    if sender.balance < amount + fee:
        raise AppError(
            400,
            "insufficient_funds",
            "Solde insuffisant pour ce transfert.",
            balance=sender.balance,
            required=amount + fee,
        )

    sender.balance -= amount + fee
    recipient.balance += amount
    tx = Transaction(
        reference=_new_reference(),
        type=TransactionType.TRANSFER,
        sender_id=sender.id,
        receiver_id=recipient.id,
        amount=amount,
        fee=fee,
        idempotency_key=key,
        created_at=utcnow(),
    )
    db.add(tx)
    return _commit(db, tx, sender, TransactionType.TRANSFER)


def _involving(user: User):
    return or_(Transaction.sender_id == user.id, Transaction.receiver_id == user.id)


def list_for_user(
    db: Session, user: User, limit: int, cursor: uuid.UUID | None
) -> tuple[list[Transaction], uuid.UUID | None]:
    query = (
        select(Transaction)
        .where(_involving(user))
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .limit(limit + 1)
    )
    if cursor is not None:
        anchor = get_for_user(db, user, cursor)
        query = query.where(
            tuple_(Transaction.created_at, Transaction.id) < (anchor.created_at, anchor.id)
        )

    rows = list(db.scalars(query))
    has_more = len(rows) > limit
    rows = rows[:limit]
    return rows, (rows[-1].id if has_more else None)


def get_for_user(db: Session, user: User, tx_id: uuid.UUID) -> Transaction:
    tx = db.scalars(select(Transaction).where(Transaction.id == tx_id, _involving(user))).first()
    if tx is None:
        raise AppError(404, "transaction_not_found", "Transaction introuvable.")
    return tx
