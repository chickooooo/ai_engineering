"""Fixtures for the tests that need a live database."""

from collections.abc import Iterator

import pytest
from sqlalchemy.orm import Session

from app.database import get_engine


@pytest.fixture
def session() -> Iterator[Session]:
    """A session whose writes are rolled back when the test ends.

    Everything runs inside one outer transaction that is never committed,
    so tests leave the development database exactly as they found it.
    """
    connection = get_engine().connect()
    transaction = connection.begin()

    with Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
    ) as session:
        yield session

    transaction.rollback()
    connection.close()
