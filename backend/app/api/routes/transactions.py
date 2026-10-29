import uuid
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import DbSession, VerifiedUser
from app.models import Transaction, TransactionType, User
from app.schemas.transaction import (
    DepositIn,
    OperationOut,
    TransactionOut,
    TransactionPage,
    TransferIn,
)
from app.schemas.user import RecipientOut
from app.services import transactions as tx_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _counterparty(user: User | None) -> RecipientOut | None:
    if user is None:
        return None
    return RecipientOut(phone=user.phone, full_name=user.full_name or user.phone)


def tx_out(tx: Transaction, viewer: User) -> TransactionOut:
    outgoing = tx.type is TransactionType.TRANSFER and tx.sender_id == viewer.id
    if tx.type is TransactionType.DEPOSIT:
        counterparty = None
    else:
        counterparty = _counterparty(tx.receiver if outgoing else tx.sender)
    return TransactionOut(
        id=tx.id,
        reference=tx.reference,
        type=tx.type,
        direction="out" if outgoing else "in",
        amount=tx.amount,
        fee=tx.fee if outgoing else 0,
        counterparty=counterparty,
        created_at=tx.created_at,
    )


def _operation(tx: Transaction, user: User, db: DbSession) -> OperationOut:
    db.refresh(user)
    return OperationOut(transaction=tx_out(tx, user), balance=user.balance)


@router.post("/deposit", status_code=status.HTTP_201_CREATED)
def deposit(body: DepositIn, user: VerifiedUser, db: DbSession) -> OperationOut:
    tx = tx_service.deposit(db, user, body.amount, body.idempotency_key)
    return _operation(tx, user, db)


@router.post("/transfer", status_code=status.HTTP_201_CREATED)
def transfer(body: TransferIn, user: VerifiedUser, db: DbSession) -> OperationOut:
    tx = tx_service.transfer(
        db, user, body.to_phone, body.amount, body.pin, body.idempotency_key
    )
    return _operation(tx, user, db)


@router.get("")
def list_transactions(
    user: VerifiedUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    cursor: uuid.UUID | None = None,
) -> TransactionPage:
    rows, next_cursor = tx_service.list_for_user(db, user, limit, cursor)
    return TransactionPage(items=[tx_out(tx, user) for tx in rows], next_cursor=next_cursor)


@router.get("/{tx_id}")
def get_transaction(tx_id: uuid.UUID, user: VerifiedUser, db: DbSession) -> TransactionOut:
    return tx_out(tx_service.get_for_user(db, user, tx_id), user)
