from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.clock import utcnow
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.identity import Identity


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("balance >= 0", name="balance_non_negative"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    phone: Mapped[str] = mapped_column(String(16), unique=True)
    pin_hash: Mapped[str] = mapped_column(String(60))
    phone_verified: Mapped[bool] = mapped_column(default=False)
    balance: Mapped[int] = mapped_column(BigInteger, default=0)

    failed_pin_attempts: Mapped[int] = mapped_column(default=0)
    lock_level: Mapped[int] = mapped_column(default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    identity: Mapped[Identity | None] = relationship(back_populates="user", lazy="selectin")

    @property
    def full_name(self) -> str | None:
        return self.identity.full_name if self.identity else None
