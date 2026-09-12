"""The mapped models against the schema a migration actually built."""

from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    Chat,
    LLMCallStatus,
    LLMMessage,
    LLMMessageContent,
    LLMModel,
    LLMProvider,
    Message,
    MessageAuthor,
    MessageType,
)


def make_chat(session: Session, name: str = "First chat") -> Chat:
    """Persist a chat and hand it back with its id filled in."""
    chat = Chat(name=name)
    session.add(chat)
    session.flush()

    return chat


def make_model(session: Session, name: str = "claude-haiku") -> LLMModel:
    """Persist a provider and one of its models, priced."""
    provider = LLMProvider(name="ANTHROPIC")
    session.add(provider)
    session.flush()

    model = LLMModel(
        provider_id=provider.id,
        name=name,
        input_price=Decimal("1.000000"),
        cached_input_price=Decimal("0.100000"),
        cache_write_price=Decimal("1.250000"),
        output_price=Decimal("5.000000"),
    )
    session.add(model)
    session.flush()

    return model


def make_call(session: Session, **kwargs: object) -> LLMMessage:
    """Persist a successful call against a fresh chat and model."""
    chat = make_chat(session)
    model = make_model(session)

    call = LLMMessage(
        llm_id=model.id,
        chat_id=chat.id,
        status=LLMCallStatus.SUCCESS,
        input_price=model.input_price,
        cached_input_price=model.cached_input_price,
        cache_write_price=model.cache_write_price,
        output_price=model.output_price,
        **kwargs,
    )
    session.add(call)
    session.flush()

    return call


def test_a_chat_starts_active_and_timestamped(session: Session) -> None:
    """`is_active` and both timestamps are filled in by the database."""
    chat = make_chat(session)

    assert chat.is_active is True
    assert chat.created_at.tzinfo is not None
    assert chat.updated_at.tzinfo is not None


def test_timestamps_are_stored_with_a_timezone(session: Session) -> None:
    """Not naive, so comparing across zones cannot silently drift."""
    chat = make_chat(session)

    assert chat.created_at <= datetime.now(UTC)


def test_a_message_belongs_to_its_chat(session: Session) -> None:
    """The relationship reads back from either side."""
    chat = make_chat(session)
    message = Message(
        chat_id=chat.id,
        content="hello",
        created_by=MessageAuthor.USER,
    )
    session.add(message)
    session.flush()

    assert message.type is MessageType.TEXT
    assert session.get(Chat, chat.id) is not None
    assert message.chat.name == chat.name


def test_every_author_is_accepted(session: Session) -> None:
    """USER, MODEL and SYSTEM are all valid enum values."""
    chat = make_chat(session)

    for author in MessageAuthor:
        session.add(
            Message(chat_id=chat.id, content="x", created_by=author),
        )

    session.flush()

    assert len(session.scalars(select(Message)).all()) == len(MessageAuthor)


def test_deleting_a_chat_takes_its_messages(session: Session) -> None:
    """The cascade keeps orphan messages out of the table."""
    chat = make_chat(session)
    session.add(
        Message(chat_id=chat.id, content="x", created_by=MessageAuthor.USER),
    )
    session.flush()

    session.delete(chat)
    session.flush()

    assert session.scalars(select(Message)).all() == []


def test_a_provider_name_is_unique(session: Session) -> None:
    """Two providers of the same name would split every cost rollup."""
    session.add(LLMProvider(name="ANTHROPIC"))
    session.add(LLMProvider(name="ANTHROPIC"))

    with pytest.raises(IntegrityError):
        session.flush()


def test_a_model_name_is_unique_per_provider(session: Session) -> None:
    """The same model name may exist under two different providers."""
    model = make_model(session)
    session.add(LLMModel(provider_id=model.provider_id, name=model.name))

    with pytest.raises(IntegrityError):
        session.flush()


def test_a_call_records_every_token_bucket(session: Session) -> None:
    """The five counts are stored separately, none of them merged."""
    call = make_call(
        session,
        input_tokens=100,
        cached_input_tokens=900,
        cache_write_tokens=50,
        output_tokens=200,
        reasoning_tokens=120,
    )

    assert call.input_tokens == 100
    assert call.cached_input_tokens == 900
    assert call.cache_write_tokens == 50
    assert call.output_tokens == 200
    assert call.reasoning_tokens == 120


def test_token_counts_default_to_zero(session: Session) -> None:
    """A failed call need not supply any of them."""
    call = make_call(session)

    assert call.input_tokens == 0
    assert call.cost == 0


def test_a_negative_token_count_is_rejected(session: Session) -> None:
    """The check constraint catches a miscounted response."""
    with pytest.raises(IntegrityError):
        make_call(session, input_tokens=-1)


def test_a_successful_call_may_not_carry_an_error(session: Session) -> None:
    """Status and error cannot contradict each other."""
    with pytest.raises(IntegrityError):
        make_call(session, error="boom")


def test_a_failed_call_needs_no_message(session: Session) -> None:
    """There is nothing to point at when the provider refused."""
    chat = make_chat(session)
    model = make_model(session)

    call = LLMMessage(
        llm_id=model.id,
        chat_id=chat.id,
        status=LLMCallStatus.ERROR,
        error="429 rate limited",
        input_price=model.input_price,
        cached_input_price=model.cached_input_price,
        cache_write_price=model.cache_write_price,
        output_price=model.output_price,
    )
    session.add(call)
    session.flush()

    assert call.message_id is None
    assert call.content is None


def test_the_rates_charged_are_kept_on_the_call(session: Session) -> None:
    """A later price change cannot rewrite what a past call cost."""
    call = make_call(session, cost=Decimal("0.00123456"))

    assert call.input_price == Decimal("1.000000")
    assert call.cost == Decimal("0.00123456")


def test_cost_keeps_its_fractional_scale(session: Session) -> None:
    """Rounding to two places would zero out most individual calls."""
    call = make_call(session, cost=Decimal("0.00000075"))

    session.expire(call)

    assert call.cost == Decimal("0.00000075")


def test_content_is_reachable_from_the_call(session: Session) -> None:
    """Split into its own table, but still one hop away."""
    call = make_call(session)
    session.add(
        LLMMessageContent(
            llm_message_id=call.id,
            input_content="what is 2 + 2?",
            output_content="4",
        ),
    )
    session.flush()
    session.refresh(call)

    assert call.content is not None
    assert call.content.input_content == "what is 2 + 2?"


def test_the_call_table_holds_no_content(session: Session) -> None:
    """Usage queries must never be able to drag the text along."""
    columns = set(LLMMessage.__table__.columns.keys())

    assert "input_content" not in columns
    assert "output_content" not in columns


def test_deleting_a_call_takes_its_content(session: Session) -> None:
    """No orphaned prompt text left behind."""
    call = make_call(session)
    session.add(
        LLMMessageContent(llm_message_id=call.id, input_content="hello"),
    )
    session.flush()

    session.delete(call)
    session.flush()

    assert session.scalars(select(LLMMessageContent)).all() == []
