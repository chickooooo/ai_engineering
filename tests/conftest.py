"""Fixtures that apply to every test.

Nothing in the suite touches the network: the provider SDK clients are
replaced with fakes, and this is the backstop if one ever slips through.
"""

import pytest


@pytest.fixture(autouse=True)
def dummy_api_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    """Safety net so a missed patch can never use a real key."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
