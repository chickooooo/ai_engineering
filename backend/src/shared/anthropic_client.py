import anthropic

from .ai_client import AIClient


class AnthropicClient(AIClient[anthropic.Anthropic]):
    """AIClient implementation backed by the Anthropic Messages API."""

    DEFAULT_MODEL = "claude-haiku-4-5-20251001"

    def _create_client(self) -> anthropic.Anthropic:
        # Reads ANTHROPIC_API_KEY from the environment
        return anthropic.Anthropic()

    def send_message(self, message: str) -> str:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": message,
                }
            ],
        )

        # A response can hold multiple blocks; keep only the text ones
        return "".join(
            block.text for block in response.content if block.type == "text"
        )

    def ping(self) -> bool:
        try:
            # Metadata only, so this costs no tokens
            self.client.models.list(limit=1)
            return True
        # Base class of every error the SDK raises, network ones included
        except anthropic.AnthropicError:
            return False
