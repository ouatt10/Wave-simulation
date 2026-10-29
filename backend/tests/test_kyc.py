import pytest

PHONE = "+2250700000001"


@pytest.fixture
def headers(make_user, login):
    make_user(PHONE, kyc=False)
    return login(PHONE)


def _submit(client, headers, **overrides):
    data = {
        "first_name": "Awa",
        "last_name": "Koné",
        "birth_date": "1998-04-12",
        "id_type": "cni",
        "id_number": "ci001234567",
        **overrides,
    }
    files = {"photo": ("cni.jpg", b"\xff\xd8\xff fake jpeg", "image/jpeg")}
    return client.post("/kyc", headers=headers, data=data, files=files)


def test_kyc_unlocks_account(client, headers):
    res = _submit(client, headers)
    assert res.status_code == 201
    body = res.json()
    assert body["kyc_completed"] is True
    assert body["first_name"] == "Awa"
    assert client.get("/transactions", headers=headers).status_code == 200


def test_kyc_only_once(client, headers):
    _submit(client, headers)
    assert _submit(client, headers).status_code == 409


def test_kyc_rejects_minor(client, headers):
    res = _submit(client, headers, birth_date="2015-01-01")
    assert res.json()["error"]["code"] == "underage"
