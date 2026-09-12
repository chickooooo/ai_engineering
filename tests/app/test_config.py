"""Tests for the settings read from the environment and `.env`."""

import pytest
from pydantic import ValidationError

from app.config import Settings, get_settings
from shared import Provider


@pytest.fixture(autouse=True)
def clear_settings_cache() -> None:
    """Keep `get_settings`'s cache from leaking between tests."""
    get_settings.cache_clear()


def test_ai_provider_defaults_to_anthropic() -> None:
    """The field falls back to Anthropic when nothing sets it."""
    field = Settings.model_fields["ai_provider"]

    assert field.default is Provider.ANTHROPIC


def test_ai_provider_is_read_from_the_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """`AI_PROVIDER` in the environment sets the provider."""
    monkeypatch.setenv("AI_PROVIDER", "openai")

    assert Settings().ai_provider is Provider.OPENAI


def test_ai_provider_is_parsed_into_the_enum(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The raw string becomes a `Provider` member, not a `str`."""
    monkeypatch.setenv("AI_PROVIDER", "anthropic")

    assert Settings().ai_provider is Provider.ANTHROPIC


def test_unknown_ai_provider_fails_at_startup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An unrecognised `AI_PROVIDER` raises instead of being accepted."""
    monkeypatch.setenv("AI_PROVIDER", "gemini")

    with pytest.raises(ValidationError):
        Settings()


def test_unrelated_env_vars_are_ignored(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """An unrelated environment variable does not break the settings."""
    monkeypatch.setenv("SOME_OTHER_KEY", "value")

    assert Settings().ai_provider in list(Provider)


def test_settings_are_read_once(monkeypatch: pytest.MonkeyPatch) -> None:
    """`get_settings` caches, so a later env change is not picked up."""
    monkeypatch.setenv("AI_PROVIDER", "openai")
    first = get_settings()

    # A later change is not picked up: the process keeps its startup config
    monkeypatch.setenv("AI_PROVIDER", "anthropic")

    assert get_settings() is first
    assert get_settings().ai_provider is Provider.OPENAI
