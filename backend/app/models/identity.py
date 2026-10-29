from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.clock import utcnow
from app.db.base import Base, enum_values

if TYPE_CHECKING:
    from app.models.user import User


class IdType(enum.StrEnum):
    CNI = "cni"
    PASSPORT = "passport"


class Identity(Base):
    """KYC simulé : la vérification est acceptée automatiquement."""

    __tablename__ = "identities"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    birth_date: Mapped[date]
    id_type: Mapped[IdType] = mapped_column(
        Enum(IdType, name="id_type", values_callable=enum_values)
    )
    id_number: Mapped[str] = mapped_column(String(50), unique=True)
    id_photo_path: Mapped[str] = mapped_column(String(255))
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User] = relationship(back_populates="identity")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
