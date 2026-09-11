import openai

from .ai_client import AIClient


class OpenAIClient(AIClient[openai.OpenAI]):
    """AIClient implementation backed by the OpenAI Responses API."""

    DEFAULT_MODEL = "gpt-5-nano"

    def _create_client(self) -> openai.OpenAI:
        # Reads OPENAI_API_KEY from the environment
        return openai.OpenAI()

    def send_message(self, message: str) -> str:
        response = self.client.responses.create(
            model=self.model,
            max_output_tokens=self.max_tokens,
            input=[
                {
                    "role": "user",
                    "content": message,
                }
            ],
        )

        # Convenience accessor that concatenates the output text blocks
        return response.output_text

    def ping(self) -> bool:
        try:
            # Metadata only, so this costs no tokens
            self.client.models.list()
            return True
        # Base class of every error the SDK raises, network ones included
        except openai.OpenAIError:
            return False
