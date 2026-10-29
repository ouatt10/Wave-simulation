from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User

DbSession = Annotated[Session, Depends(get_db)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    if credentials is None:
        raise AppError(401, "not_authenticated", "Connexion requise.")
    try:
        user_id = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise AppError(401, "token_expired", "Session expirée. Saisis ton code PIN.") from None
    except jwt.InvalidTokenError:
        raise AppError(401, "invalid_token", "Session invalide.") from None

    user = db.get(User, user_id)
    if user is None or not user.phone_verified:
        raise AppError(401, "invalid_token", "Session invalide.")
    return user


def require_kyc(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.identity is None:
        raise AppError(403, "kyc_required", "Vérifie ton identité pour utiliser ton compte.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
VerifiedUser = Annotated[User, Depends(require_kyc)]
