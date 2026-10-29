import os

# Hachage rapide pendant les tests (doit être défini avant d'importer l'app).
os.environ.setdefault("BCRYPT_ROUNDS", "4")

from datetime import date  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

import app.models  # noqa: E402, F401
from app.core.config import settings  # noqa: E402
from app.core.security import hash_secret  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.models import IdType, Identity, User  # noqa: E402

DEFAULT_PIN = "1234"


@pytest.fixture(scope="session")
def engine():
    if not settings.test_database_url:
        pytest.skip("TEST_DATABASE_URL n'est pas défini dans .env")
    engine = create_engine(settings.test_database_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session_factory(engine):
    with engine.begin() as conn:
        tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
        conn.execute(text(f"TRUNCATE {tables} CASCADE"))
    return sessionmaker(engine)


@pytest.fixture
def client(session_factory, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))

    def override_get_db():
        with session_factory() as db:
            yield db

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as c:
        yield c
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def make_user(session_factory):
    """Crée directement en base un compte vérifié (avec KYC par défaut)."""
    counter = iter(range(1, 10_000))

    def _make(phone: str, balance: int = 0, kyc: bool = True, pin: str = DEFAULT_PIN) -> User:
        with session_factory() as db:
            user = User(phone=phone, pin_hash=hash_secret(pin), phone_verified=True, balance=balance)
            if kyc:
                n = next(counter)
                user.identity = Identity(
                    first_name="Prénom",
                    last_name=f"Test{n}",
                    birth_date=date(1995, 1, 1),
                    id_type=IdType.CNI,
                    id_number=f"CI{phone[1:]}",
                    id_photo_path="test.jpg",
                )
            db.add(user)
            db.commit()
            db.refresh(user)
            db.expunge(user)
            return user

    return _make


@pytest.fixture
def login(client):
    def _login(phone: str, pin: str = DEFAULT_PIN) -> dict[str, str]:
        res = client.post("/auth/login", json={"phone": phone, "pin": pin})
        assert res.status_code == 200, res.json()
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    return _login


@pytest.fixture
def balance_of(session_factory):
    def _balance(phone: str) -> int:
        with session_factory() as db:
            return db.scalar(text("SELECT balance FROM users WHERE phone = :p"), {"p": phone})

    return _balance
