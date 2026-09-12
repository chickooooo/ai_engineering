"""The backend talking to the real Postgres it is configured for.

These need the database running, which is why the suite runs inside the
container: `make backend-test` brings up the `db` service first.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_engine, get_session


@pytest.fixture(autouse=True)
def fresh_engine() -> None:
    """Build this test's engine from this test's settings."""
    get_settings.cache_clear()
    get_engine.cache_clear()


def test_the_configured_database_answers() -> None:
    """The URL from the environment reaches a live Postgres."""
    with get_engine().connect() as connection:
        assert connection.execute(text("select 1")).scalar() == 1


def test_it_is_postgres_on_the_other_end() -> None:
    """Not some other database that happens to speak the same wire."""
    with get_engine().connect() as connection:
        version = connection.execute(text("select version()")).scalar_one()

    assert "PostgreSQL" in version


def test_get_session_yields_a_usable_session() -> None:
    """The request dependency hands back a session that can query."""
    sessions = get_session()
    session = next(sessions)

    assert isinstance(session, Session)
    assert session.execute(text("select 1")).scalar() == 1
    assert session.in_transaction()

    # Exhausting the generator is what closes the session, which ends its
    # transaction and returns the connection to the pool
    next(sessions, None)

    assert not session.in_transaction()
