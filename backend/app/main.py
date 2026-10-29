from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.api.routes import auth, kyc, transactions, users
from app.core.config import settings
from app.core.errors import AppError, app_error_handler, validation_error_handler

app = FastAPI(
    title="WAVE — API de simulation",
    description="Simulation pédagogique : aucun argent réel, aucun lien avec le service Wave.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)


for module in (auth, kyc, users, transactions):
    app.include_router(module.router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
