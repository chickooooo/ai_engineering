"""Fake of the `anthropic.Anthropic` client."""

from typing import Any

from .models import FakeModels


class FakeTextBlock:
    """A response block carrying text."""

    type = "text"

    def __init__(self, text: str) -> None:
        self.text = text


class FakeToolUseBlock:
    """A non-text response block, which `send_message` drops."""

    type = "tool_use"
    text = "should be ignored"


type FakeBlock = FakeTextBlock | FakeToolUseBlock


class FakeMessage:
    """Stands in for what `messages.create` returns."""

    def __init__(self, content: list[FakeBlock]) -> None:
        self.content = content


class FakeMessages:
    """Stands in for `anthropic.Anthropic().messages`.

    Set `content` to the blocks the next response should carry; `calls`
    records the keyword arguments every call was made with.
    """

    def __init__(self) -> None:
        self.content: list[FakeBlock] = []
        self.calls: list[dict[str, Any]] = []

    def create(self, **kwargs: Any) -> FakeMessage:
        self.calls.append(kwargs)

        return FakeMessage(self.content)


class FakeAnthropic:
    """Stands in for an `anthropic.Anthropic` instance."""

    def __init__(self) -> None:
        self.messages = FakeMessages()
        self.models = FakeModels()
