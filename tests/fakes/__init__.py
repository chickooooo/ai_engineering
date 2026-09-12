"""Test doubles for the provider SDK clients.

These replace the SDK object a client wraps, so no test reaches the
network or spends tokens. The fixtures that patch them in live in
`tests/shared/conftest.py`.
"""

from .anthropic import (
    FakeAnthropic,
    FakeBlock,
    FakeMessage,
    FakeMessages,
    FakeTextBlock,
    FakeToolUseBlock,
)
from .models import FakeModels
from .openai import FakeOpenAI, FakeResponse, FakeResponses

__all__ = [
    "FakeAnthropic",
    "FakeBlock",
    "FakeMessage",
    "FakeMessages",
    "FakeModels",
    "FakeOpenAI",
    "FakeResponse",
    "FakeResponses",
    "FakeTextBlock",
    "FakeToolUseBlock",
]
