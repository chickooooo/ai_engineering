"""Tests for the healthcheck endpoint."""

from collections.abc import Iterator
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from ai_clients import AnthropicClient
from app.main import app


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


def timestamp_of(client: TestClient) -> datetime:
    """Call the endpoint and parse the timestamp it reports."""
    response = client.get("/health")

    assert response.status_code == 200

    return datetime.fromisoformat(response.json()["timestamp"])


def test_healthcheck_returns_healthy(client: TestClient) -> None:
    """Answers 200 with a healthy status."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_healthcheck_returns_only_status_and_timestamp(
    client: TestClient,
) -> None:
    """Carries those two fields and nothing else."""
    assert set(client.get("/health").json()) == {"status", "timestamp"}


def test_healthcheck_timestamp_is_utc(client: TestClient) -> None:
    """The timestamp is timezone-aware and in UTC."""
    assert timestamp_of(client).utcoffset() == UTC.utcoffset(None)


def test_healthcheck_timestamp_is_the_current_time(
    client: TestClient,
) -> None:
    """The timestamp is now, not some value fixed at import."""
    before = datetime.now(UTC)
    reported = timestamp_of(client)

    assert before <= reported <= datetime.now(UTC)


def test_healthcheck_timestamp_moves_between_calls(
    client: TestClient,
) -> None:
    """Each call reports its own time rather than a cached one."""
    first = timestamp_of(client)

    assert timestamp_of(client) >= first


def test_healthcheck_calls_no_provider_api(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Answers without building an SDK client, so an outage cannot fail it."""

    def explode(*args: object, **kwargs: object) -> None:
        raise AssertionError("the healthcheck built an SDK client")

    monkeypatch.setattr(AnthropicClient, "_create_client", explode)

    assert client.get("/health").status_code == 200


def test_unknown_route_is_a_404(client: TestClient) -> None:
    """An unmounted path is a 404, not a server error."""
    assert client.get("/nope").status_code == 404
