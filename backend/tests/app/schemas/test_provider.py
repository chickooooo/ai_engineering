"""Tests for the provider request and response schemas."""

import pytest
from pydantic import ValidationError

from app.schemas import ProviderCreate, ProviderUpdate


def test_a_name_is_required() -> None:
    """A provider without a name is rejected before it reaches the table."""
    with pytest.raises(ValidationError):
        ProviderCreate()


def test_an_empty_name_is_rejected() -> None:
    """Blank names would make the list unreadable."""
    with pytest.raises(ValidationError):
        ProviderCreate(name="")


def test_a_too_long_name_is_rejected() -> None:
    """The column holds 50 characters."""
    with pytest.raises(ValidationError):
        ProviderCreate(name="A" * 51)


def test_an_update_may_change_nothing() -> None:
    """Every field is optional, so a partial update needs no filler."""
    assert ProviderUpdate().model_dump(exclude_unset=True) == {}


def test_an_update_carries_only_what_was_sent() -> None:
    """`exclude_unset` is what keeps a PATCH from blanking other fields."""
    update = ProviderUpdate(is_active=False)

    assert update.model_dump(exclude_unset=True) == {"is_active": False}
