"""Tests for the root endpoint."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from ai_clients import AnthropicClient, OpenAIClient
from app.main import app


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


def test_root_returns_a_welcome_message(client: TestClient) -> None:
    """Answers 200 with the welcome message."""
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Welcome to the AI Engineering service!",
    }


def test_root_returns_only_the_message(client: TestClient) -> None:
    """Carries that one field and nothing else."""
    assert set(client.get("/").json()) == {"message"}


def test_root_calls_no_provider_api(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Greeting a caller costs nothing and needs no provider."""

    def explode(*args: object, **kwargs: object) -> None:
        raise AssertionError("the root endpoint built an SDK client")

    monkeypatch.setattr(AnthropicClient, "_create_client", explode)
    monkeypatch.setattr(OpenAIClient, "_create_client", explode)

    assert client.get("/").status_code == 200
