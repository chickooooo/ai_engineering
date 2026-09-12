"""Fake of the `models` resource both provider SDKs expose."""

from typing import Any


class FakeModels:
    """Stands in for `client.models`, the resource `ping` calls.

    Set `error` to make the call fail the way a bad key or a network
    problem would.
    """

    def __init__(self) -> None:
        self.error: Exception | None = None
        self.calls: list[dict[str, Any]] = []

    def list(self, **kwargs: Any) -> list[str]:
        self.calls.append(kwargs)

        if self.error is not None:
            raise self.error

        return ["a-model"]
