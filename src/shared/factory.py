from enum import StrEnum

from .anthropic_client import AnthropicClient
from .openai_client import OpenAIClient

# Every client `create_client` can hand back. Spelled as a union rather than
# the generic base so callers keep a precise type to work with.
type AnyAIClient = AnthropicClient | OpenAIClient


class Provider(StrEnum):
    """The AI providers this project can talk to.

    The value is what `AI_PROVIDER` holds in `.env`.
    """

    ANTHROPIC = "anthropic"
    OPENAI = "openai"


CLIENT_TYPES: dict[Provider, type[AnyAIClient]] = {
    Provider.ANTHROPIC: AnthropicClient,
    Provider.OPENAI: OpenAIClient,
}


def create_client(
    provider: Provider,
    model: str | None = None,
    max_tokens: int | None = None,
) -> AnyAIClient:
    """Build the client for `provider`, using its defaults where unset."""
    return CLIENT_TYPES[provider](model=model, max_tokens=max_tokens)


def default_model(provider: Provider) -> str:
    """The model `provider` uses when none is given.

    Reads the class attribute, so no SDK client is built and no API key is
    needed.
    """
    return CLIENT_TYPES[provider].DEFAULT_MODEL
