from google import genai
from google.genai import errors, types

from .ai_client import AIClient


class GeminiClient(AIClient[genai.Client]):
    """AIClient implementation backed by the Gemini API."""

    DEFAULT_MODEL = "gemini-2.5-flash"

    def _create_client(self) -> genai.Client:
        # Reads GEMINI_API_KEY from the environment
        return genai.Client()

    def send_message(self, message: str) -> str:
        response = self.client.models.generate_content(
            model=self.model,
            contents=message,
            config=types.GenerateContentConfig(
                max_output_tokens=self.max_tokens,
            ),
        )

        # `text` is None when the response carries no text parts
        return response.text or ""

    def ping(self) -> bool:
        try:
            # Metadata only, so this costs no tokens
            self.client.models.list(config=types.ListModelsConfig(page_size=1))
            return True
        # Base class of every error the API itself returns
        except errors.APIError:
            return False
