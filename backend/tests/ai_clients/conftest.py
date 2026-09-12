"""Fixtures for the provider client tests.

Each one patches a provider SDK so the client under test wraps a fake,
and hands that fake back for the test to arrange and assert on.
"""

import anthropic
import openai
import pytest
from google import genai

from tests.fakes import FakeAnthropic, FakeGemini, FakeOpenAI


@pytest.fixture
def fake_anthropic(monkeypatch: pytest.MonkeyPatch) -> FakeAnthropic:
    """Make `AnthropicClient()` wrap this fake instead of the real SDK."""
    fake = FakeAnthropic()
    monkeypatch.setattr(anthropic, "Anthropic", lambda: fake)

    return fake


@pytest.fixture
def fake_openai(monkeypatch: pytest.MonkeyPatch) -> FakeOpenAI:
    """Make `OpenAIClient()` wrap this fake instead of the real SDK."""
    fake = FakeOpenAI()
    monkeypatch.setattr(openai, "OpenAI", lambda: fake)

    return fake


@pytest.fixture
def fake_gemini(monkeypatch: pytest.MonkeyPatch) -> FakeGemini:
    """Make `GeminiClient()` wrap this fake instead of the real SDK."""
    fake = FakeGemini()
    monkeypatch.setattr(genai, "Client", lambda: fake)

    return fake
