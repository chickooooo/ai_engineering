"""The environment-to-app path, with the real modules wired together.

Unlike the unit tests, nothing here is faked or overridden: the provider
comes from the environment, `create_app` reads it through `Settings`, and
the factory builds from that same value. No provider API is called, so
these stay offline like the rest of the suite.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from ai_clients import Provider, create_client, default_model
from app.config import get_settings
from app.main import create_app


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Iterator[None]:
    """Let each test start the app with its own environment."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.parametrize("provider", list(Provider))
def test_the_app_serves_under_each_provider(
    monkeypatch: pytest.MonkeyPatch,
    provider: Provider,
) -> None:
    """Both endpoints answer whichever provider the environment names."""
    monkeypatch.setenv("AI_PROVIDER", provider.value)

    with TestClient(create_app()) as client:
        assert client.get("/").status_code == 200
        assert client.get("/health").json()["status"] == "healthy"


@pytest.mark.parametrize("provider", list(Provider))
def test_the_env_provider_reaches_the_factory(
    monkeypatch: pytest.MonkeyPatch,
    provider: Provider,
) -> None:
    """`AI_PROVIDER` selects the client the factory hands back."""
    monkeypatch.setenv("AI_PROVIDER", provider.value)
    create_app()

    client = create_client(get_settings().ai_provider)

    assert client.model == default_model(provider)


def test_it_falls_back_when_no_provider_is_set(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """With nothing in the environment, `.env` or the default wins."""
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    create_app()

    assert get_settings().ai_provider in list(Provider)
