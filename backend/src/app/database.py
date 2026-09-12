from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.config import get_settings


@lru_cache
def get_engine() -> Engine:
    """The process's one connection pool, built on first use.

    `pool_pre_ping` checks a pooled connection before handing it out, so a
    database restart does not fail the next request.
    """
    return create_engine(
        str(get_settings().database_url),
        pool_pre_ping=True,
    )


def get_session() -> Iterator[Session]:
    """A session for one request, closed when the request ends."""
    with Session(get_engine()) as session:
        yield session
