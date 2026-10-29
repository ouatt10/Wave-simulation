import threading
import uuid
from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy import select

from app.core.errors import AppError
from app.models import User
from app.services import transactions as tx_service

ALICE = "+2250700000001"
BOB = "+2250700000002"


def _key() -> str:
    return str(uuid.uuid4())


def _transfer(client, headers, amount, to=BOB, pin="1234", key=None):
    return client.post(
        "/transactions/transfer",
        headers=headers,
        json={"to_phone": to, "amount": amount, "pin": pin, "idempotency_key": key or _key()},
    )


def test_deposit_increases_balance(client, make_user, login):
    make_user(ALICE)
    res = client.post(
        "/transactions/deposit",
        headers=login(ALICE),
        json={"amount": 5_000, "idempotency_key": _key()},
    )
    assert res.status_code == 201
    assert res.json()["balance"] == 5_000
    assert res.json()["transaction"]["direction"] == "in"


def test_deposit_is_idempotent(client, make_user, login, balance_of):
    make_user(ALICE)
    headers, key = login(ALICE), _key()
    first = client.post("/transactions/deposit", headers=headers, json={"amount": 5_000, "idempotency_key": key})
    second = client.post("/transactions/deposit", headers=headers, json={"amount": 5_000, "idempotency_key": key})
    assert first.json()["transaction"]["id"] == second.json()["transaction"]["id"]
    assert balance_of(ALICE) == 5_000


@pytest.mark.parametrize("amount", [0, 99, 1_500_001, 100.5, "5000"])
def test_amount_limits(client, make_user, login, amount):
    make_user(ALICE)
    res = client.post(
        "/transactions/deposit",
        headers=login(ALICE),
        json={"amount": amount, "idempotency_key": _key()},
    )
    assert res.status_code == 422


def test_transfer_moves_money_and_charges_fee(client, make_user, login, balance_of):
    make_user(ALICE, balance=10_000)
    make_user(BOB)
    res = _transfer(client, login(ALICE), 5_000)
    assert res.status_code == 201
    body = res.json()
    assert body["balance"] == 4_950
    assert body["transaction"]["fee"] == 50
    assert body["transaction"]["counterparty"]["phone"] == BOB
    assert balance_of(BOB) == 5_000

    bob_view = client.get("/transactions", headers=login(BOB)).json()["items"][0]
    assert bob_view["direction"] == "in"
    assert bob_view["fee"] == 0
    assert bob_view["counterparty"]["phone"] == ALICE


def test_transfer_requires_amount_plus_fee(client, make_user, login, balance_of):
    make_user(ALICE, balance=5_000)
    make_user(BOB)
    res = _transfer(client, login(ALICE), 5_000)
    assert res.status_code == 400
    assert res.json()["error"]["required"] == 5_050
    assert balance_of(ALICE) == 5_000


def test_transfer_wrong_pin_changes_nothing(client, make_user, login, balance_of):
    make_user(ALICE, balance=10_000)
    make_user(BOB)
    res = _transfer(client, login(ALICE), 1_000, pin="0000")
    assert res.status_code == 401
    assert balance_of(ALICE) == 10_000
    assert balance_of(BOB) == 0


@pytest.mark.parametrize(
    ("to", "status", "code"),
    [(ALICE, 400, "self_transfer"), ("+2250799999999", 404, "recipient_not_found")],
)
def test_transfer_invalid_recipient(client, make_user, login, to, status, code):
    make_user(ALICE, balance=10_000)
    res = _transfer(client, login(ALICE), 1_000, to=to)
    assert res.status_code == status
    assert res.json()["error"]["code"] == code


def test_recipient_without_kyc_is_not_found(client, make_user, login):
    make_user(ALICE, balance=10_000)
    make_user(BOB, kyc=False)
    assert _transfer(client, login(ALICE), 1_000).status_code == 404


def test_lookup_returns_name(client, make_user, login):
    make_user(ALICE)
    make_user(BOB)
    res = client.get("/users/lookup", headers=login(ALICE), params={"phone": BOB})
    assert res.status_code == 200
    assert res.json()["full_name"].startswith("Prénom")


def test_history_pagination_and_privacy(client, make_user, login):
    make_user(ALICE)
    make_user(BOB)
    alice = login(ALICE)
    for _ in range(5):
        client.post("/transactions/deposit", headers=alice, json={"amount": 100, "idempotency_key": _key()})

    page1 = client.get("/transactions", headers=alice, params={"limit": 3}).json()
    page2 = client.get("/transactions", headers=alice, params={"limit": 3, "cursor": page1["next_cursor"]}).json()
    assert len(page1["items"]) == 3
    assert len(page2["items"]) == 2
    assert page2["next_cursor"] is None
    ids = {t["id"] for t in page1["items"] + page2["items"]}
    assert len(ids) == 5

    tx_id = page1["items"][0]["id"]
    assert client.get(f"/transactions/{tx_id}", headers=alice).status_code == 200
    assert client.get(f"/transactions/{tx_id}", headers=login(BOB)).status_code == 404


def test_concurrent_transfers_never_overdraw(make_user, session_factory, balance_of):
    """Deux transferts simultanés de 10 000 avec 10 100 en solde : un seul doit passer."""
    alice = make_user(ALICE, balance=10_100)
    make_user(BOB)
    barrier = threading.Barrier(2)

    def send():
        with session_factory() as db:
            sender = db.scalars(select(User).where(User.id == alice.id)).one()
            barrier.wait()
            try:
                tx_service.transfer(db, sender, BOB, 10_000, "1234", uuid.uuid4())
                return "ok"
            except AppError as exc:
                return exc.code

    with ThreadPoolExecutor(2) as pool:
        results = sorted(pool.map(lambda _: send(), range(2)))

    assert results == ["insufficient_funds", "ok"]
    assert balance_of(ALICE) == 0
    assert balance_of(BOB) == 10_000
