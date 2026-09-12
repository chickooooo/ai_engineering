"""Tests for the engine the app talks to Postgres through."""

import pytest

from app.config import get_settings
from app.database import get_engine


@pytest.fixture(autouse=True)
def fresh_engine() -> None:
    """Build this test's engine from this test's settings."""
    get_settings.cache_clear()
    get_engine.cache_clear()


def test_engine_uses_the_configured_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The engine points at whatever `DATABASE_URL` names."""
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://someone:secret@elsewhere:5432/other",
    )

    url = get_engine().url

    assert url.host == "elsewhere"
    assert url.database == "other"


def test_engine_keeps_the_password_out_of_its_repr(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A logged engine must not leak the database password."""
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://someone:secret@elsewhere:5432/other",
    )

    assert "secret" not in repr(get_engine())


def test_engine_is_built_once() -> None:
    """One connection pool is shared, rather than one per caller."""
    assert get_engine() is get_engine()


def test_engine_checks_connections_before_handing_them_out() -> None:
    """`pool_pre_ping` is what survives a database restart."""
    assert get_engine().pool._pre_ping is True
