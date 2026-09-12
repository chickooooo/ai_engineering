"""Tests for the provider registry that `AI_PROVIDER` selects from."""

import pytest

from ai_clients import (
    CLIENT_TYPES,
    AnthropicClient,
    AnyAIClient,
    OpenAIClient,
    Provider,
    create_client,
    default_model,
)


@pytest.mark.parametrize("provider", list(Provider))
def test_every_provider_has_a_client(provider: Provider) -> None:
    """Guards against adding an enum member and forgetting the registry."""
    assert provider in CLIENT_TYPES


def test_provider_values_are_what_the_env_file_holds() -> None:
    """Enum values match the strings `AI_PROVIDER` is set to."""
    assert Provider.ANTHROPIC.value == "anthropic"
    assert Provider.OPENAI.value == "openai"


def test_provider_is_parsed_from_its_value() -> None:
    """A provider string resolves to its enum member."""
    assert Provider("openai") is Provider.OPENAI


def test_unknown_provider_is_rejected() -> None:
    """An unknown provider string raises rather than resolving."""
    with pytest.raises(ValueError):
        Provider("mistral")


@pytest.mark.parametrize(
    ("provider", "expected"),
    [
        (Provider.ANTHROPIC, AnthropicClient),
        (Provider.OPENAI, OpenAIClient),
    ],
)
def test_create_client_builds_the_matching_client(
    provider: Provider,
    expected: type[AnyAIClient],
) -> None:
    """Each provider builds its own client class."""
    assert isinstance(create_client(provider), expected)


def test_create_client_passes_the_settings_through() -> None:
    """The model and token limit reach the built client."""
    client = create_client(Provider.ANTHROPIC, model="m", max_tokens=5)

    assert client.model == "m"
    assert client.max_tokens == 5


def test_create_client_falls_back_to_the_provider_defaults() -> None:
    """An unset model and token limit leave the client's defaults."""
    client = create_client(Provider.OPENAI)

    assert client.model == OpenAIClient.DEFAULT_MODEL
    assert client.max_tokens == OpenAIClient.DEFAULT_MAX_TOKENS


@pytest.mark.parametrize("provider", list(Provider))
def test_default_model_is_never_empty(provider: Provider) -> None:
    """Every provider declares a non-empty default model."""
    assert default_model(provider)


def test_default_model_matches_the_client() -> None:
    """The reported default is the client class's own."""
    assert default_model(Provider.ANTHROPIC) == AnthropicClient.DEFAULT_MODEL
    assert default_model(Provider.OPENAI) == OpenAIClient.DEFAULT_MODEL
