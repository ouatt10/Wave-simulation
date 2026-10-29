import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.models import TransactionType
from app.schemas.fields import Amount, Phone, Pin
from app.schemas.user import RecipientOut


class DepositIn(BaseModel):
    amount: Amount
    idempotency_key: uuid.UUID


class TransferIn(BaseModel):
    to_phone: Phone
    amount: Amount
    pin: Pin
    idempotency_key: uuid.UUID


class TransactionOut(BaseModel):
    id: uuid.UUID
    reference: str
    type: TransactionType
    # Vu par l'utilisateur connecté : "in" = argent reçu, "out" = argent envoyé.
    direction: Literal["in", "out"]
    amount: int
    # Frais payés par l'utilisateur connecté (0 pour le destinataire).
    fee: int
    counterparty: RecipientOut | None
    created_at: datetime


class OperationOut(BaseModel):
    transaction: TransactionOut
    balance: int


class TransactionPage(BaseModel):
    items: list[TransactionOut]
    next_cursor: uuid.UUID | None
