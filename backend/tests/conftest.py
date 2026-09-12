"""Fixtures that apply to every test.

Nothing in the suite touches a provider API: the SDK clients are replaced
with fakes, and this is the backstop if one ever slips through.
"""

from collections.abc import Iterator

import pytest

from app.database import get_engine


@pytest.fixture(autouse=True)
def dummy_api_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    """Safety net so a missed patch can never use a real key."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")


@pytest.fixture(autouse=True)
def dispose_engine() -> Iterator[None]:
    """Return pooled connections, so none outlive the test that opened them.

    Without this a cached engine is garbage collected with its connections
    still open, which `filterwarnings = error` turns into a failure in
    whatever test happens to be running at the time.
    """
    yield

    if get_engine.cache_info().currsize:
        get_engine().dispose()
        get_engine.cache_clear()
