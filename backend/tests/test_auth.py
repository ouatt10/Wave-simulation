from datetime import timedelta

import pytest
from sqlalchemy import update

from app.core.clock import utcnow
from app.models import OtpCode, User

PHONE = "+2250700000001"


@pytest.fixture
def fixed_otp(monkeypatch):
    monkeypatch.setattr("app.services.otp.generate_code", lambda: "123456")
    return "123456"


def test_register_then_verify_otp_gives_token_requiring_kyc(client, fixed_otp):
    res = client.post("/auth/register", json={"phone": "+225 07 00 00 00 01", "pin": "4321"})
    assert res.status_code == 202
    assert res.json()["phone"] == PHONE

    res = client.post("/auth/otp/verify", json={"phone": PHONE, "code": fixed_otp})
    assert res.status_code == 200
    body = res.json()
    assert body["kyc_required"] is True

    headers = {"Authorization": f"Bearer {body['access_token']}"}
    assert client.get("/me", headers=headers).json()["kyc_completed"] is False
    res = client.get("/transactions", headers=headers)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "kyc_required"


def test_register_rejects_verified_phone(client, make_user):
    make_user(PHONE)
    res = client.post("/auth/register", json={"phone": PHONE, "pin": "1234"})
    assert res.status_code == 409


@pytest.mark.parametrize("pin", ["123", "12345", "abcd"])
def test_register_rejects_bad_pin(client, pin):
    assert client.post("/auth/register", json={"phone": PHONE, "pin": pin}).status_code == 422


def test_resend_is_throttled(client, fixed_otp):
    client.post("/auth/register", json={"phone": PHONE, "pin": "1234"})
    res = client.post("/auth/otp/resend", json={"phone": PHONE})
    assert res.status_code == 429
    assert 0 < res.json()["error"]["retry_after"] <= 60


def test_wrong_otp_counts_attempts(client, fixed_otp):
    client.post("/auth/register", json={"phone": PHONE, "pin": "1234"})
    res = client.post("/auth/otp/verify", json={"phone": PHONE, "code": "000000"})
    assert res.status_code == 400
    assert res.json()["error"]["attempts_remaining"] == 4


def test_expired_otp_is_rejected(client, fixed_otp, session_factory):
    client.post("/auth/register", json={"phone": PHONE, "pin": "1234"})
    with session_factory() as db:
        db.execute(update(OtpCode).values(expires_at=utcnow() - timedelta(seconds=1)))
        db.commit()
    res = client.post("/auth/otp/verify", json={"phone": PHONE, "code": fixed_otp})
    assert res.json()["error"]["code"] == "otp_expired"


def _expire_lock(session_factory):
    with session_factory() as db:
        db.execute(update(User).values(locked_until=utcnow() - timedelta(seconds=1)))
        db.commit()


def test_progressive_lockout(client, make_user, session_factory):
    make_user(PHONE)

    def attempt(pin="9999"):
        return client.post("/auth/login", json={"phone": PHONE, "pin": pin})

    assert attempt().json()["error"]["attempts_remaining"] == 2
    assert attempt().json()["error"]["attempts_remaining"] == 1
    res = attempt()
    assert res.status_code == 423
    assert res.json()["error"]["retry_after"] == 60

    # Bloqué : même le bon PIN est refusé.
    assert attempt("1234").status_code == 423

    # Après le délai, une seule erreur suffit à rebloquer, plus longtemps.
    _expire_lock(session_factory)
    res = attempt()
    assert res.status_code == 423
    assert res.json()["error"]["retry_after"] == 5 * 60

    _expire_lock(session_factory)
    assert attempt().json()["error"]["retry_after"] == 15 * 60
    _expire_lock(session_factory)
    assert attempt().json()["error"]["retry_after"] == 60 * 60
    _expire_lock(session_factory)
    assert attempt().json()["error"]["retry_after"] == 60 * 60

    # Le bon PIN remet tout à zéro.
    _expire_lock(session_factory)
    assert attempt("1234").status_code == 200
    assert attempt().json()["error"]["attempts_remaining"] == 2


def test_login_unknown_phone(client):
    res = client.post("/auth/login", json={"phone": PHONE, "pin": "1234"})
    assert res.status_code == 401

def test_validation_errors_use_app_format(client):
    res = client.post("/auth/register", json={"phone": "0700", "pin": "123"})

    assert res.status_code == 422
    error = res.json()["error"]
    assert error["code"] == "validation_error"
    assert set(error["fields"]) == {"phone", "pin"}
    assert error["fields"]["pin"] == "Le code PIN doit contenir 4 chiffres."




def test_change_pin(client, make_user, login):
    make_user(PHONE)
    headers = login(PHONE)

    res = client.post("/me/pin", headers=headers, json={"current_pin": "9999", "new_pin": "4826"})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "invalid_pin"

    res = client.post("/me/pin", headers=headers, json={"current_pin": "1234", "new_pin": "1234"})
    assert res.json()["error"]["code"] == "same_pin"

    assert client.post("/me/pin", headers=headers, json={"current_pin": "1234", "new_pin": "4826"}).status_code == 204
    assert client.post("/auth/login", json={"phone": PHONE, "pin": "1234"}).status_code == 401
    login(PHONE, pin="4826")
