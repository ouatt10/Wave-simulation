import pytest

from app.core.rules import compute_fee


@pytest.mark.parametrize(
    ("amount", "fee"),
    [(100, 1), (101, 2), (150, 2), (10_000, 100), (10_050, 101), (1_500_000, 15_000)],
)
def test_fee_is_one_percent_rounded_up(amount, fee):
    assert compute_fee(amount) == fee
