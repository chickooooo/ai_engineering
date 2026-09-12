"""Fixtures for the tests that need a live database."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import get_engine, get_session
from app.main import create_app


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


@pytest.fixture
def client(session: Session) -> Iterator[TestClient]:
    """An API client whose requests share the rolled-back session.

    The routers commit, but that only releases a savepoint inside the
    test's outer transaction, so nothing survives the test.
    """
    app = create_app()
    app.dependency_overrides[get_session] = lambda: session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
