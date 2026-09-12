"""Tests for the healthcheck endpoint."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app
from shared import AnthropicClient, OpenAIClient, Provider


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def use_provider(provider: Provider) -> None:
    """Pin the app to `provider`, whatever `.env` happens to say."""
    app.dependency_overrides[get_settings] = lambda: Settings(
        ai_provider=provider,
    )


def test_healthcheck_returns_ok(client: TestClient) -> None:
    """Answers 200 with the status, provider and model."""
    use_provider(Provider.ANTHROPIC)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "provider": "anthropic",
        "model": AnthropicClient.DEFAULT_MODEL,
    }


def test_healthcheck_reports_the_configured_provider(
    client: TestClient,
) -> None:
    """Reports whichever provider the settings name."""
    use_provider(Provider.OPENAI)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "provider": "openai",
        "model": OpenAIClient.DEFAULT_MODEL,
    }


def test_healthcheck_calls_no_provider_api(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Answers without building an SDK client, so an outage cannot fail it."""
    use_provider(Provider.ANTHROPIC)

    def explode(*args: object, **kwargs: object) -> None:
        raise AssertionError("the healthcheck built an SDK client")

    monkeypatch.setattr(AnthropicClient, "_create_client", explode)

    assert client.get("/health").status_code == 200


def test_unknown_route_is_a_404(client: TestClient) -> None:
    """An unmounted path is a 404, not a server error."""
    assert client.get("/nope").status_code == 404
