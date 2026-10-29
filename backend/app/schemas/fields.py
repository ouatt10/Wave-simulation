import re
from typing import Annotated

from pydantic import BeforeValidator, Field, StringConstraints

from app.core.rules import MAX_AMOUNT, MIN_AMOUNT


def _strip_phone(value):
    # "+225 07 00-00.00 00" → "+2250700000000"
    return re.sub(r"[\s.\-()]", "", value) if isinstance(value, str) else value


# Format international E.164 : + indicatif pays, 8 à 15 chiffres au total.
Phone = Annotated[
    str,
    BeforeValidator(_strip_phone),
    StringConstraints(pattern=r"^\+[1-9]\d{7,14}$"),
]
Pin = Annotated[str, StringConstraints(pattern=r"^\d{4}$")]
OtpCode = Annotated[str, StringConstraints(pattern=r"^\d{6}$")]
Amount = Annotated[int, Field(ge=MIN_AMOUNT, le=MAX_AMOUNT, strict=True)]
