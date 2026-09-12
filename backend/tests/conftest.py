"""Fixtures that apply to every test.

Two things every test can rely on: no provider API is ever called, and the
database is a throwaway created for this run, never the development one.
"""

import os
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, Connection, make_url

from app.config import Settings, get_settings
from app.database import get_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]

# Connected to in order to create and drop the test database, since a
# database cannot be dropped from a connection into it
MAINTENANCE_DATABASE = "postgres"


@pytest.fixture(autouse=True)
def dummy_api_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    """Safety net so a missed patch can never use a real key."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")


@pytest.fixture(scope="session", autouse=True)
def test_database() -> Iterator[None]:
    """Build a database for this run, migrate it, and drop it afterwards.

    A real Postgres rather than a stub, so enums, foreign keys and check
    constraints are exercised. Development data is never read or written,
    and every run starts from empty tables and id sequences at 1.
    """
    development_url = make_url(str(Settings().database_url))
    test_url = development_url.set(database=f"{development_url.database}_test")

    recreate(development_url, test_url)

    os.environ["DATABASE_URL"] = test_url.render_as_string(hide_password=False)
    get_settings.cache_clear()
    get_engine.cache_clear()

    migrate()

    yield

    get_engine().dispose()
    get_engine.cache_clear()
    drop(development_url, test_url)


@contextmanager
def maintenance(development_url: URL) -> Iterator[Connection]:
    """A connection able to CREATE and DROP databases.

    Points at the maintenance database, since neither statement can run
    from a connection into the database it is acting on.
    """
    engine = create_engine(
        development_url.set(database=MAINTENANCE_DATABASE),
        isolation_level="AUTOCOMMIT",
    )

    with engine.connect() as connection:
        yield connection

    engine.dispose()


def recreate(development_url: URL, test_url: URL) -> None:
    """Drop any leftover test database and make a fresh one."""
    with maintenance(development_url) as connection:
        connection.execute(
            text(f'DROP DATABASE IF EXISTS "{test_url.database}"')
        )
        connection.execute(text(f'CREATE DATABASE "{test_url.database}"'))


def drop(development_url: URL, test_url: URL) -> None:
    """Remove the test database, evicting anything still connected."""
    with maintenance(development_url) as connection:
        connection.execute(
            text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity"
                " WHERE datname = :name AND pid <> pg_backend_pid()"
            ),
            {"name": test_url.database},
        )
        connection.execute(
            text(f'DROP DATABASE IF EXISTS "{test_url.database}"')
        )


def migrate() -> None:
    """Build the schema the same way production gets it: the migrations."""
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "migrations"))

    command.upgrade(config, "head")


@pytest.fixture(autouse=True)
def dispose_engine() -> Iterator[None]:
    """Return pooled connections, so none outlive the test that opened them.

    Without this a cached engine is garbage collected with its connections
    still open, which `filterwarnings = error` turns into a failure in
    whatever test happens to be running at the time.
    """
    yield

    if get_engine.cache_info().currsize:
        get_engine().dispose()
        get_engine.cache_clear()
