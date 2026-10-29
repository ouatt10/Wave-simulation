import uuid
from datetime import date
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.routes.users import me_out
from app.core.config import settings
from app.core.errors import AppError
from app.core.rules import MAX_ID_PHOTO_BYTES, MIN_AGE_YEARS
from app.models import IdType, Identity
from app.schemas.user import MeOut

router = APIRouter(tags=["kyc"])

_PHOTO_EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png"}

Name = Annotated[str, Form(min_length=2, max_length=100)]


def _age(birth_date: date, today: date) -> int:
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


@router.post("/kyc", status_code=status.HTTP_201_CREATED)
def submit_kyc(
    user: CurrentUser,
    db: DbSession,
    first_name: Name,
    last_name: Name,
    birth_date: Annotated[date, Form()],
    id_type: Annotated[IdType, Form()],
    id_number: Annotated[str, Form(min_length=4, max_length=50)],
    photo: Annotated[UploadFile, File()],
) -> MeOut:
    if user.identity is not None:
        raise AppError(409, "kyc_already_done", "Ton identité est déjà vérifiée.")
    if _age(birth_date, date.today()) < MIN_AGE_YEARS:
        raise AppError(400, "underage", f"Il faut avoir au moins {MIN_AGE_YEARS} ans.")

    id_number = id_number.strip().upper()
    if db.scalars(select(Identity).where(Identity.id_number == id_number)).first():
        raise AppError(409, "id_number_taken", "Cette pièce d'identité est déjà utilisée.")

    extension = _PHOTO_EXTENSIONS.get(photo.content_type or "")
    if extension is None:
        raise AppError(400, "invalid_photo", "La photo doit être au format JPEG ou PNG.")
    content = photo.file.read(MAX_ID_PHOTO_BYTES + 1)
    if len(content) > MAX_ID_PHOTO_BYTES:
        raise AppError(400, "photo_too_large", "La photo ne doit pas dépasser 5 Mo.")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    photo_path = upload_dir / f"{user.id}_{uuid.uuid4().hex}{extension}"
    photo_path.write_bytes(content)

    user.identity = Identity(
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        birth_date=birth_date,
        id_type=id_type,
        id_number=id_number,
        id_photo_path=photo_path.as_posix(),
    )
    db.commit()
    return me_out(user)
