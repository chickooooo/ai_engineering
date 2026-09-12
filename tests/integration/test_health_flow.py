"""The settings-to-endpoint path, with the real modules wired together.

Unlike the unit tests, nothing here is faked or overridden: the provider
comes from the environment, `create_app` reads it through `Settings`, and
the endpoint answers from the real client registry. No provider API is
called, so these stay offline like the rest of the suite.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import create_app
from shared import Provider, create_client, default_model


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Iterator[None]:
    """Let each test start the app with its own environment."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def health_body() -> dict[str, str]:
    """Start the app as configured and return what `/health` reports."""
    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200

    return dict(response.json())


@pytest.mark.parametrize("provider", list(Provider))
def test_env_provider_reaches_the_endpoint(
    monkeypatch: pytest.MonkeyPatch,
    provider: Provider,
) -> None:
    """`AI_PROVIDER` in the environment reaches the endpoint's response."""
    monkeypatch.setenv("AI_PROVIDER", provider.value)

    assert health_body() == {
        "status": "ok",
        "provider": provider.value,
        "model": default_model(provider),
    }


@pytest.mark.parametrize("provider", list(Provider))
def test_the_reported_provider_builds_a_working_client(
    monkeypatch: pytest.MonkeyPatch,
    provider: Provider,
) -> None:
    """What `/health` advertises is what the factory hands back."""
    monkeypatch.setenv("AI_PROVIDER", provider.value)
    body = health_body()

    client = create_client(Provider(body["provider"]))

    assert client.model == body["model"]


def test_it_falls_back_when_no_provider_is_set(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """With nothing in the environment, `.env` or the default wins."""
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    body = health_body()

    assert body["provider"] in list(Provider)
    assert body["model"] == default_model(Provider(body["provider"]))
