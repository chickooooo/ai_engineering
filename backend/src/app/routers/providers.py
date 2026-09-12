from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import SessionDep
from app.models import LLMProvider
from app.schemas import ProviderCreate, ProviderRead, ProviderUpdate

router = APIRouter(prefix="/providers", tags=["providers"])


def get_or_404(session: SessionDep, provider_id: int) -> LLMProvider:
    """Load a provider, or fail the request with a 404."""
    provider = session.get(LLMProvider, provider_id)

    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No provider with id {provider_id}",
        )

    return provider


def reject_duplicate_name(
    session: SessionDep,
    name: str,
    exclude_id: int | None = None,
) -> None:
    """Keep two providers from sharing a name, which would split rollups."""
    query = select(LLMProvider).where(LLMProvider.name == name)

    if exclude_id is not None:
        query = query.where(LLMProvider.id != exclude_id)

    if session.scalars(query).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A provider named {name!r} already exists",
        )


@router.get("")
def list_providers(
    session: SessionDep,
    include_inactive: bool = True,
) -> list[ProviderRead]:
    """Every provider, newest last."""
    query = select(LLMProvider).order_by(LLMProvider.id)

    if not include_inactive:
        query = query.where(LLMProvider.is_active)

    return [
        ProviderRead.model_validate(provider)
        for provider in session.scalars(query)
    ]


@router.get("/{provider_id}")
def read_provider(session: SessionDep, provider_id: int) -> ProviderRead:
    """One provider by id."""
    return ProviderRead.model_validate(get_or_404(session, provider_id))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_provider(session: SessionDep, body: ProviderCreate) -> ProviderRead:
    """Add a provider."""
    reject_duplicate_name(session, body.name)

    provider = LLMProvider(name=body.name)
    session.add(provider)
    session.commit()
    session.refresh(provider)

    return ProviderRead.model_validate(provider)


@router.patch("/{provider_id}")
def update_provider(
    session: SessionDep,
    provider_id: int,
    body: ProviderUpdate,
) -> ProviderRead:
    """Change a provider's name or whether it is active."""
    provider = get_or_404(session, provider_id)

    if body.name is not None:
        reject_duplicate_name(session, body.name, exclude_id=provider_id)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)

    session.commit()
    session.refresh(provider)

    return ProviderRead.model_validate(provider)


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_provider(session: SessionDep, provider_id: int) -> None:
    """Retire a provider.

    Deactivates rather than deletes: its models and its recorded usage
    still reference it, and that history has to stay readable.
    """
    provider = get_or_404(session, provider_id)
    provider.is_active = False
    session.commit()
