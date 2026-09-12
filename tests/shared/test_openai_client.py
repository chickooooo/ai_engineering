"""Tests for the OpenAI client, backed by a fake SDK object."""

import openai
import pytest

from shared import OpenAIClient
from tests.fakes import FakeOpenAI


def test_create_client_builds_the_real_sdk_client() -> None:
    """The unpatched client wraps a real `openai.OpenAI`."""
    client = OpenAIClient()

    assert isinstance(client.client, openai.OpenAI)


def test_default_model(fake_openai: FakeOpenAI) -> None:
    """Falls back to the nano default when no model is given."""
    assert OpenAIClient().model == "gpt-5-nano"


def test_send_message_passes_the_configured_settings(
    fake_openai: FakeOpenAI,
) -> None:
    """Sends the model, token limit and message it was built with."""
    fake_openai.responses.output_text = "hello"

    OpenAIClient(model="a-model", max_tokens=15).send_message(
        "Tell me a joke",
    )

    assert fake_openai.responses.calls == [
        {
            "model": "a-model",
            "max_output_tokens": 15,
            "input": [{"role": "user", "content": "Tell me a joke"}],
        }
    ]


def test_send_message_returns_the_output_text(
    fake_openai: FakeOpenAI,
) -> None:
    """Returns the response's concatenated output text."""
    fake_openai.responses.output_text = "hello world"

    assert OpenAIClient().send_message("hi") == "hello world"


def test_send_message_returns_empty_string_without_output(
    fake_openai: FakeOpenAI,
) -> None:
    """Returns an empty string when the response carries no text."""
    fake_openai.responses.output_text = ""

    assert OpenAIClient().send_message("hi") == ""


def test_ping_succeeds(fake_openai: FakeOpenAI) -> None:
    """Reports reachable when the models endpoint answers."""
    assert OpenAIClient().ping() is True
    assert fake_openai.models.calls == [{}]


def test_ping_fails_on_sdk_errors(fake_openai: FakeOpenAI) -> None:
    """Reports unreachable when the SDK raises its own error."""
    fake_openai.models.error = openai.OpenAIError("incorrect api key")

    assert OpenAIClient().ping() is False


def test_ping_lets_unrelated_errors_through(
    fake_openai: FakeOpenAI,
) -> None:
    """Lets a non-SDK error reach the caller instead of returning False."""
    fake_openai.models.error = RuntimeError("boom")

    with pytest.raises(RuntimeError):
        OpenAIClient().ping()
