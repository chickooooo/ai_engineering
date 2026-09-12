from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class MessageType(StrEnum):
    """What a message carries. Only text for now."""

    TEXT = "TEXT"


class MessageAuthor(StrEnum):
    """Who put a message in the chat."""

    USER = "USER"
    MODEL = "MODEL"
    SYSTEM = "SYSTEM"


class Chat(Base):
    """One conversation."""

    __tablename__ = "chats"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))

    # Soft delete: a chat is hidden rather than removed
    is_active: Mapped[bool] = mapped_column(
        default=True, server_default="true"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    # Bumped on new activity, so the chat list can sort without a join
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat",
        cascade="all, delete-orphan",
    )


class Message(Base):
    """One message in a chat, whoever wrote it."""

    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_chat_id_created_at", "chat_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE")
    )

    type: Mapped[MessageType] = mapped_column(
        Enum(MessageType, name="message_type"),
        default=MessageType.TEXT,
        server_default=MessageType.TEXT.value,
    )
    content: Mapped[str] = mapped_column(Text)
    created_by: Mapped[MessageAuthor] = mapped_column(
        Enum(MessageAuthor, name="message_author")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    chat: Mapped[Chat] = relationship(back_populates="messages")
