from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.rules import MAX_AMOUNT, MIN_AMOUNT



class AppError(Exception):
    """Erreur métier renvoyée au client sous la forme {"error": {"code", "message", ...}}."""

    def __init__(self, status_code: int, code: str, message: str, **extra):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.extra = extra


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    headers = {}
    if "retry_after" in exc.extra:
        headers["Retry-After"] = str(exc.extra["retry_after"])
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, **exc.extra}},
        headers=headers,
    )

def _fcfa(amount: int) -> str:
    return f"{amount:,}".replace(",", " ")


FIELD_MESSAGES = {
    "phone": "Numéro de téléphone invalide.",
    "to_phone": "Numéro du destinataire invalide.",
    "pin": "Le code PIN doit contenir 4 chiffres.",
    "current_pin": "Le code PIN doit contenir 4 chiffres.",
    "new_pin": "Le code PIN doit contenir 4 chiffres.",
    "code": "Le code doit contenir 6 chiffres.",
    "amount": f"Le montant doit être compris entre {_fcfa(MIN_AMOUNT)} et {_fcfa(MAX_AMOUNT)} FCFA.",
}


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    fields = {}
    for err in exc.errors():
        name = str(err["loc"][-1])
        fields.setdefault(name, FIELD_MESSAGES.get(name, "Valeur invalide."))
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Certaines informations sont invalides.",
                "fields": fields,
            }
        },
    )

