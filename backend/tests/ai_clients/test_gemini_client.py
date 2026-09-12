"""Tests for the Gemini client, backed by a fake SDK object."""

import pytest
from google import genai
from google.genai import errors

from ai_clients import GeminiClient
from tests.fakes import FakeGemini


def test_create_client_builds_the_real_sdk_client() -> None:
    """The unpatched client wraps a real `genai.Client`."""
    client = GeminiClient()

    assert isinstance(client.client, genai.Client)


def test_default_model(fake_gemini: FakeGemini) -> None:
    """Falls back to the flash default when no model is given."""
    assert GeminiClient().model == "gemini-2.5-flash"


def test_send_message_passes_the_configured_settings(
    fake_gemini: FakeGemini,
) -> None:
    """Sends the model, token limit and message it was built with."""
    GeminiClient(model="a-model", max_tokens=15).send_message(
        "Tell me a joke",
    )

    call = fake_gemini.models.generate_calls[0]

    assert call["model"] == "a-model"
    assert call["contents"] == "Tell me a joke"
    assert call["config"].max_output_tokens == 15


def test_send_message_returns_the_text(fake_gemini: FakeGemini) -> None:
    """Returns the text the response carries."""
    fake_gemini.models.text = "hello world"

    assert GeminiClient().send_message("hi") == "hello world"


def test_send_message_returns_empty_string_without_text(
    fake_gemini: FakeGemini,
) -> None:
    """Returns an empty string when the response carries no text parts."""
    fake_gemini.models.text = None

    assert GeminiClient().send_message("hi") == ""


def test_ping_succeeds_and_asks_for_a_single_model(
    fake_gemini: FakeGemini,
) -> None:
    """Reports reachable, asking the models endpoint for one entry."""
    assert GeminiClient().ping() is True
    assert fake_gemini.models.calls[0]["config"].page_size == 1


def test_ping_fails_on_sdk_errors(fake_gemini: FakeGemini) -> None:
    """Reports unreachable when the API returns an error."""
    fake_gemini.models.error = errors.APIError(401, {})

    assert GeminiClient().ping() is False


def test_ping_lets_unrelated_errors_through(
    fake_gemini: FakeGemini,
) -> None:
    """Lets a non-SDK error reach the caller instead of returning False."""
    fake_gemini.models.error = RuntimeError("boom")

    with pytest.raises(RuntimeError):
        GeminiClient().ping()
