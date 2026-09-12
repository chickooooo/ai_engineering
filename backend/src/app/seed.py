"""Put the providers this app can talk to into the database.

Idempotent: run it as often as you like. It adds what is missing and
never touches prices, which are entered on the Manage Models screen.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from ai_clients import Provider, default_model
from app.database import get_engine
from app.models import LLMModel, LLMProvider


def seed(session: Session) -> list[str]:
    """Add every provider and its default model, returning what was added."""
    added: list[str] = []

    for provider_enum in Provider:
        name = provider_enum.name
        provider = session.scalars(
            select(LLMProvider).where(LLMProvider.name == name)
        ).first()

        if provider is None:
            provider = LLMProvider(name=name)
            session.add(provider)
            session.flush()
            added.append(f"provider {name}")

        model_name = default_model(provider_enum)
        exists = session.scalars(
            select(LLMModel).where(
                LLMModel.provider_id == provider.id,
                LLMModel.name == model_name,
            )
        ).first()

        if exists is not None:
            continue

        # Left unpriced: no provider publishes rates over its API, so
        # they are entered on the Manage Models screen
        session.add(LLMModel(provider_id=provider.id, name=model_name))
        added.append(f"model {name}/{model_name}")

    session.commit()

    return added


def main() -> None:
    """Entry point for `make backend-seed`."""
    with Session(get_engine()) as session:
        added = seed(session)

    print("\n".join(added) if added else "nothing to add")


if __name__ == "__main__":
    main()
