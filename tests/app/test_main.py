"""Tests for the application factory."""

from collections.abc import Iterator

import pytest
from pydantic import ValidationError

from app.config import get_settings
from app.main import create_app


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Iterator[None]:
    """Keep a test's environment out of the next test's settings."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_create_app_mounts_every_router() -> None:
    """The built app exposes both endpoints in its OpenAPI schema."""
    paths = create_app().openapi()["paths"]

    assert set(paths) == {"/", "/health"}


def test_create_app_returns_a_fresh_app() -> None:
    """Each call builds a separate app instance."""
    assert create_app() is not create_app()


def test_create_app_rejects_an_unknown_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A bad `AI_PROVIDER` stops startup rather than the first request."""
    monkeypatch.setenv("AI_PROVIDER", "gemini")

    with pytest.raises(ValidationError):
        create_app()
