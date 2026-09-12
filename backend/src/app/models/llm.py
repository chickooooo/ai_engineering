from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

# Prices are quoted per million tokens, the way providers publish them
PRICE = Numeric(12, 6)

# Costs are fractions of a cent, so they need scale rather than precision
COST = Numeric(14, 8)


class LLMCallStatus(StrEnum):
    """How a call to a provider ended."""

    SUCCESS = "SUCCESS"
    ERROR = "ERROR"


class LLMProvider(Base):
    """A company whose models we call."""

    __tablename__ = "llm_providers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    is_active: Mapped[bool] = mapped_column(
        default=True, server_default="true"
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    models: Mapped[list["LLMModel"]] = relationship(back_populates="provider")


class LLMModel(Base):
    """One model of one provider, with its current list price."""

    __tablename__ = "llm_models"
    __table_args__ = (
        UniqueConstraint(
            "provider_id", "name", name="uq_llm_models_provider_name"
        ),
        CheckConstraint(
            "input_price >= 0 AND cached_input_price >= 0"
            " AND cache_write_price >= 0 AND output_price >= 0",
            name="ck_llm_models_prices_not_negative",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("llm_providers.id"))
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(
        default=True, server_default="true"
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    input_price: Mapped[Decimal] = mapped_column(PRICE, server_default="0")
    cached_input_price: Mapped[Decimal] = mapped_column(
        PRICE, server_default="0"
    )
    cache_write_price: Mapped[Decimal] = mapped_column(
        PRICE, server_default="0"
    )
    output_price: Mapped[Decimal] = mapped_column(PRICE, server_default="0")

    provider: Mapped[LLMProvider] = relationship(back_populates="models")


class LLMMessage(Base):
    """One call to a provider: what it cost and how it went.

    Carries no prompt or completion text; that lives in
    `LLMMessageContent`, so usage queries never read it.
    """

    __tablename__ = "llm_messages"
    __table_args__ = (
        Index("ix_llm_messages_chat_id_created_at", "chat_id", "created_at"),
        Index("ix_llm_messages_llm_id_created_at", "llm_id", "created_at"),
        Index("ix_llm_messages_created_at", "created_at"),
        CheckConstraint(
            "input_tokens >= 0 AND cached_input_tokens >= 0"
            " AND cache_write_tokens >= 0 AND output_tokens >= 0"
            " AND reasoning_tokens >= 0 AND cost >= 0",
            name="ck_llm_messages_amounts_not_negative",
        ),
        CheckConstraint(
            "status = 'ERROR' OR error IS NULL",
            name="ck_llm_messages_error_only_when_failed",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    llm_id: Mapped[int] = mapped_column(ForeignKey("llm_models.id"))
    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE")
    )

    # Null when the call failed, so there is no message to point at
    message_id: Mapped[int | None] = mapped_column(
        ForeignKey("messages.id", ondelete="SET NULL"),
        default=None,
    )
    provider_message_id: Mapped[str | None] = mapped_column(
        String(100),
        default=None,
    )

    status: Mapped[LLMCallStatus] = mapped_column(
        Enum(LLMCallStatus, name="llm_call_status")
    )
    error: Mapped[str | None] = mapped_column(Text, default=None)

    # Disjoint buckets: `input_tokens` excludes both cache buckets, and
    # `reasoning_tokens` is a breakdown of `output_tokens`, not an addition
    input_tokens: Mapped[int] = mapped_column(default=0, server_default="0")
    cached_input_tokens: Mapped[int] = mapped_column(
        default=0, server_default="0"
    )
    cache_write_tokens: Mapped[int] = mapped_column(
        default=0, server_default="0"
    )
    output_tokens: Mapped[int] = mapped_column(default=0, server_default="0")
    reasoning_tokens: Mapped[int] = mapped_column(
        default=0, server_default="0"
    )

    # Copied from the model at call time; list prices change
    input_price: Mapped[Decimal] = mapped_column(PRICE)
    cached_input_price: Mapped[Decimal] = mapped_column(PRICE)
    cache_write_price: Mapped[Decimal] = mapped_column(PRICE)
    output_price: Mapped[Decimal] = mapped_column(PRICE)

    cost: Mapped[Decimal] = mapped_column(COST, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    content: Mapped["LLMMessageContent | None"] = relationship(
        back_populates="llm_message",
        cascade="all, delete-orphan",
        uselist=False,
    )


class LLMMessageContent(Base):
    """The prompt and completion text for one call.

    Split out so that reading tokens and cost never drags the text along,
    and so content can be aged out while the usage history stays.
    """

    __tablename__ = "llm_message_contents"

    llm_message_id: Mapped[int] = mapped_column(
        ForeignKey("llm_messages.id", ondelete="CASCADE"),
        primary_key=True,
    )
    input_content: Mapped[str] = mapped_column(Text)
    output_content: Mapped[str | None] = mapped_column(Text, default=None)

    llm_message: Mapped[LLMMessage] = relationship(back_populates="content")
