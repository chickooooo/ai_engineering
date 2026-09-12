"""Tests for the shared base class."""

import pytest

from shared import AIClient


class StubClient(AIClient[str]):
    """Minimal concrete subclass, standing in for a real provider client."""

    DEFAULT_MODEL = "stub-model"
    DEFAULT_MAX_TOKENS = 42

    def _create_client(self) -> str:
        return "sdk-client"


def test_defaults_come_from_the_subclass() -> None:
    """An unconfigured client takes the subclass's model and tokens."""
    client = StubClient()

    assert client.model == "stub-model"
    assert client.max_tokens == 42


def test_arguments_override_the_defaults() -> None:
    """Explicit model and token arguments win over the defaults."""
    client = StubClient(model="other-model", max_tokens=7)

    assert client.model == "other-model"
    assert client.max_tokens == 7


def test_falsy_arguments_fall_back_to_the_defaults() -> None:
    """An empty model or zero tokens falls back to the defaults."""
    client = StubClient(model="", max_tokens=0)

    assert client.model == "stub-model"
    assert client.max_tokens == 42


def test_init_builds_the_sdk_client() -> None:
    """`__init__` stores what `_create_client` returns."""
    assert StubClient().client == "sdk-client"


def test_create_client_is_left_to_subclasses() -> None:
    """A subclass that skips `_create_client` fails on construction."""

    class BareClient(AIClient[str]):
        pass

    with pytest.raises(NotImplementedError):
        BareClient()


def test_send_message_is_left_to_subclasses() -> None:
    """The base `send_message` refuses to run."""
    with pytest.raises(NotImplementedError):
        StubClient().send_message("hi")


def test_ping_is_left_to_subclasses() -> None:
    """The base `ping` refuses to run."""
    with pytest.raises(NotImplementedError):
        StubClient().ping()


def test_repr_names_the_subclass_and_its_settings() -> None:
    """`repr` shows the subclass name, model and token limit."""
    client = StubClient(model="m", max_tokens=5)

    assert repr(client) == "StubClient(model='m', max_tokens=5)"


def test_repr_fits_the_line_length_limit() -> None:
    """`repr` stays within the project's 79-character limit."""
    assert len(repr(StubClient())) <= 79
