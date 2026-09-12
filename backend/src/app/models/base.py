from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """The declarative base every model inherits from.

    Alembic reads `Base.metadata` to work out what the schema should be.
    """
