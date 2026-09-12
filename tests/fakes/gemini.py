"""Fake of the `google.genai.Client` client."""

from typing import Any

from .models import FakeModels


class FakeGenerateContentResponse:
    """Stands in for what `models.generate_content` returns."""

    def __init__(self, text: str | None) -> None:
        self.text = text


class FakeGeminiModels(FakeModels):
    """Stands in for `genai.Client().models`.

    Unlike the other SDKs, this one resource both generates content and
    lists models, so it carries `ping`'s recorded calls as well.

    Set `text` to what the next response should carry, `None` for a
    response with no text parts; `generate_calls` records the keyword
    arguments every generation was made with.
    """

    def __init__(self) -> None:
        super().__init__()
        self.text: str | None = ""
        self.generate_calls: list[dict[str, Any]] = []

    def generate_content(
        self,
        **kwargs: Any,
    ) -> FakeGenerateContentResponse:
        self.generate_calls.append(kwargs)

        return FakeGenerateContentResponse(self.text)


class FakeGemini:
    """Stands in for a `genai.Client` instance."""

    def __init__(self) -> None:
        self.models = FakeGeminiModels()
