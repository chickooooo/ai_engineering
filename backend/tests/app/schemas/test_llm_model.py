"""Tests for the model request and response schemas."""

from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas import LLMModelCreate, LLMModelUpdate


def test_prices_default_to_zero() -> None:
    """A model can be added before its prices are known."""
    model = LLMModelCreate(provider_id=1, name="opus")

    assert model.input_price == Decimal(0)
    assert model.output_price == Decimal(0)


def test_a_negative_price_is_rejected() -> None:
    """A negative rate would make cost totals meaningless."""
    with pytest.raises(ValidationError):
        LLMModelCreate(provider_id=1, name="opus", input_price=Decimal(-1))


def test_a_price_keeps_six_decimal_places() -> None:
    """Per-million rates are quoted to that precision."""
    model = LLMModelCreate(
        provider_id=1,
        name="nano",
        input_price=Decimal("0.050000"),
    )

    assert model.input_price == Decimal("0.050000")


def test_a_price_with_too_many_places_is_rejected() -> None:
    """More precision than the column holds is a mistake, not a rounding."""
    with pytest.raises(ValidationError):
        LLMModelCreate(
            provider_id=1,
            name="nano",
            input_price=Decimal("0.0000001"),
        )


def test_a_provider_is_required() -> None:
    """A model always belongs to someone."""
    with pytest.raises(ValidationError):
        # Deliberately invalid, which is what mypy objects to as well
        LLMModelCreate(name="opus")  # type: ignore[call-arg]


def test_an_update_carries_only_what_was_sent() -> None:
    """A price change must not blank the other three."""
    update = LLMModelUpdate(output_price=Decimal("15.0"))

    assert update.model_dump(exclude_unset=True) == {
        "output_price": Decimal("15.0"),
    }


def test_an_update_rejects_a_negative_price() -> None:
    """The same rule as on create."""
    with pytest.raises(ValidationError):
        LLMModelUpdate(input_price=Decimal("-0.5"))
