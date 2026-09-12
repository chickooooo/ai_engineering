"""Tests for the Anthropic client, backed by a fake SDK object."""

import anthropic
import pytest

from shared import AnthropicClient
from tests.fakes import FakeAnthropic, FakeTextBlock, FakeToolUseBlock


def test_create_client_builds_the_real_sdk_client() -> None:
    """The unpatched client wraps a real `anthropic.Anthropic`."""
    client = AnthropicClient()

    assert isinstance(client.client, anthropic.Anthropic)


def test_default_model(fake_anthropic: FakeAnthropic) -> None:
    """Falls back to the Haiku default when no model is given."""
    assert AnthropicClient().model == "claude-haiku-4-5-20251001"


def test_send_message_passes_the_configured_settings(
    fake_anthropic: FakeAnthropic,
) -> None:
    """Sends the model, token limit and message it was built with."""
    fake_anthropic.messages.content = [FakeTextBlock("hello")]

    AnthropicClient(model="a-model", max_tokens=15).send_message(
        "Tell me a joke",
    )

    assert fake_anthropic.messages.calls == [
        {
            "model": "a-model",
            "max_tokens": 15,
            "messages": [{"role": "user", "content": "Tell me a joke"}],
        }
    ]


def test_send_message_returns_the_text(
    fake_anthropic: FakeAnthropic,
) -> None:
    """Returns the text of a single-block response."""
    fake_anthropic.messages.content = [FakeTextBlock("hello")]

    assert AnthropicClient().send_message("hi") == "hello"


def test_send_message_joins_every_text_block(
    fake_anthropic: FakeAnthropic,
) -> None:
    """Concatenates the text of every block, in order."""
    fake_anthropic.messages.content = [
        FakeTextBlock("hello "),
        FakeTextBlock("world"),
    ]

    assert AnthropicClient().send_message("hi") == "hello world"


def test_send_message_drops_non_text_blocks(
    fake_anthropic: FakeAnthropic,
) -> None:
    """Keeps only the text blocks, ignoring tool-use ones."""
    fake_anthropic.messages.content = [
        FakeTextBlock("kept"),
        FakeToolUseBlock(),
    ]

    assert AnthropicClient().send_message("hi") == "kept"


def test_send_message_returns_empty_string_without_content(
    fake_anthropic: FakeAnthropic,
) -> None:
    """Returns an empty string when the response carries no blocks."""
    fake_anthropic.messages.content = []

    assert AnthropicClient().send_message("hi") == ""


def test_ping_succeeds_and_asks_for_a_single_model(
    fake_anthropic: FakeAnthropic,
) -> None:
    """Reports reachable, asking the models endpoint for one entry."""
    assert AnthropicClient().ping() is True
    assert fake_anthropic.models.calls == [{"limit": 1}]


def test_ping_fails_on_sdk_errors(fake_anthropic: FakeAnthropic) -> None:
    """Reports unreachable when the SDK raises its own error."""
    fake_anthropic.models.error = anthropic.AnthropicError("invalid key")

    assert AnthropicClient().ping() is False


def test_ping_lets_unrelated_errors_through(
    fake_anthropic: FakeAnthropic,
) -> None:
    """Lets a non-SDK error reach the caller instead of returning False."""
    fake_anthropic.models.error = RuntimeError("boom")

    with pytest.raises(RuntimeError):
        AnthropicClient().ping()
