"""Fake of the `openai.OpenAI` client."""

from typing import Any

from .models import FakeModels


class FakeResponse:
    """Stands in for what `responses.create` returns."""

    def __init__(self, output_text: str) -> None:
        self.output_text = output_text


class FakeResponses:
    """Stands in for `openai.OpenAI().responses`.

    Set `output_text` to the text the next response should carry; `calls`
    records the keyword arguments every call was made with.
    """

    def __init__(self) -> None:
        self.output_text = ""
        self.calls: list[dict[str, Any]] = []

    def create(self, **kwargs: Any) -> FakeResponse:
        self.calls.append(kwargs)

        return FakeResponse(self.output_text)


class FakeOpenAI:
    """Stands in for an `openai.OpenAI` instance."""

    def __init__(self) -> None:
        self.responses = FakeResponses()
        self.models = FakeModels()
