from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession, VerifiedUser
from app.models import User
from app.schemas.fields import Phone
from app.schemas.user import MeOut, RecipientOut
from app.services import transactions as tx_service

router = APIRouter(tags=["users"])


def me_out(user: User) -> MeOut:
    identity = user.identity
    return MeOut(
        id=user.id,
        phone=user.phone,
        balance=user.balance,
        first_name=identity.first_name if identity else None,
        last_name=identity.last_name if identity else None,
        kyc_completed=identity is not None,
    )


@router.get("/me")
def me(user: CurrentUser) -> MeOut:
    return me_out(user)


@router.get("/users/lookup")
def lookup(user: VerifiedUser, db: DbSession, phone: Annotated[Phone, Query()]) -> RecipientOut:
    recipient = tx_service.find_recipient(db, user, phone)
    return RecipientOut(phone=recipient.phone, full_name=recipient.full_name)
