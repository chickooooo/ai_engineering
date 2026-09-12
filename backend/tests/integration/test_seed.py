"""Seeding the providers this app can talk to."""

import pytest
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ai_clients import Provider, default_model
from app.models import LLMModel, LLMProvider
from app.seed import main, seed


def names(session: Session) -> set[str]:
    """Every provider name in the database."""
    return set(session.scalars(select(LLMProvider.name)))


def empty_the_tables(session: Session) -> None:
    """Start from nothing, inside the transaction the test rolls back."""
    session.execute(delete(LLMModel))
    session.execute(delete(LLMProvider))
    session.flush()


def test_it_creates_what_is_missing(session: Session) -> None:
    """From an empty database, every provider and model is written."""
    empty_the_tables(session)

    added = seed(session)

    assert len(added) == 2 * len(list(Provider))
    assert names(session) == {provider.name for provider in Provider}


def test_it_adds_a_missing_model_to_an_existing_provider(
    session: Session,
) -> None:
    """A provider added by hand still gets its default model."""
    empty_the_tables(session)
    session.add(LLMProvider(name=Provider.ANTHROPIC.name))
    session.flush()

    added = seed(session)

    assert f"provider {Provider.ANTHROPIC.name}" not in added
    assert any(default_model(Provider.ANTHROPIC) in line for line in added)


def test_it_adds_every_provider(session: Session) -> None:
    """All three, so none has to be typed in by hand."""
    seed(session)

    assert {provider.name for provider in Provider} <= names(session)


def test_it_adds_the_default_model_for_each(session: Session) -> None:
    """The model the app reaches for first is ready to use."""
    seed(session)

    for provider_enum in Provider:
        provider = session.scalars(
            select(LLMProvider).where(LLMProvider.name == provider_enum.name)
        ).one()
        model = session.scalars(
            select(LLMModel).where(
                LLMModel.provider_id == provider.id,
                LLMModel.name == default_model(provider_enum),
            )
        ).one_or_none()

        assert model is not None


def test_models_arrive_unpriced(session: Session) -> None:
    """No provider publishes rates, so they are entered on the screen."""
    seed(session)

    provider = session.scalars(
        select(LLMProvider).where(LLMProvider.name == Provider.ANTHROPIC.name)
    ).one()
    model = session.scalars(
        select(LLMModel).where(LLMModel.provider_id == provider.id)
    ).first()

    assert model is not None
    assert model.input_price == 0
    assert model.output_price == 0


def test_running_it_twice_adds_nothing(session: Session) -> None:
    """Safe to run on every deploy."""
    seed(session)
    before = len(names(session))

    assert seed(session) == []
    assert len(names(session)) == before


def test_it_reports_what_it_added(session: Session) -> None:
    """So a deploy log says whether anything changed."""
    added = seed(session)

    assert all("provider" in line or "model" in line for line in added)


def test_main_seeds_and_reports(capsys: pytest.CaptureFixture[str]) -> None:
    """The entry point `make backend-seed` runs."""
    main()

    assert capsys.readouterr().out.strip()
