from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.clock import utcnow
from app.db.base import Base, enum_values
from app.models.user import User


class TransactionType(enum.StrEnum):
    DEPOSIT = "deposit"
    TRANSFER = "transfer"


class Transaction(Base):
    """Seules les opérations réussies sont enregistrées."""

    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_positive"),
        CheckConstraint("fee >= 0", name="fee_non_negative"),
        Index("ix_transactions_created_at_id", "created_at", "id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    reference: Mapped[str] = mapped_column(String(12), unique=True)
    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type", values_callable=enum_values)
    )
    sender_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    receiver_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int] = mapped_column(BigInteger)
    fee: Mapped[int] = mapped_column(BigInteger, default=0)
    idempotency_key: Mapped[uuid.UUID] = mapped_column(unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    sender: Mapped[User | None] = relationship(foreign_keys=[sender_id], lazy="selectin")
    receiver: Mapped[User] = relationship(foreign_keys=[receiver_id], lazy="selectin")
