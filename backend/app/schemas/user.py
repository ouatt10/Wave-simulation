import uuid

from pydantic import BaseModel


class MeOut(BaseModel):
    id: uuid.UUID
    phone: str
    balance: int
    first_name: str | None
    last_name: str | None
    kyc_completed: bool


class RecipientOut(BaseModel):
    phone: str
    full_name: str
