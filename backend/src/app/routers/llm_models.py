from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.dependencies import SessionDep
from app.models import LLMModel, LLMProvider
from app.schemas import LLMModelCreate, LLMModelRead, LLMModelUpdate

router = APIRouter(prefix="/models", tags=["models"])


def get_or_404(session: SessionDep, model_id: int) -> LLMModel:
    """Load a model, or fail the request with a 404."""
    model = session.get(LLMModel, model_id)

    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No model with id {model_id}",
        )

    return model


def require_provider(session: SessionDep, provider_id: int) -> None:
    """A model cannot belong to a provider that does not exist."""
    if session.get(LLMProvider, provider_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No provider with id {provider_id}",
        )


def reject_duplicate_name(
    session: SessionDep,
    provider_id: int,
    name: str,
    exclude_id: int | None = None,
) -> None:
    """Names repeat across providers, but never within one."""
    query = select(LLMModel).where(
        LLMModel.provider_id == provider_id,
        LLMModel.name == name,
    )

    if exclude_id is not None:
        query = query.where(LLMModel.id != exclude_id)

    if session.scalars(query).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"That provider already has a model named {name!r}",
        )


@router.get("")
def list_models(
    session: SessionDep,
    provider_id: int | None = None,
    include_inactive: bool = True,
) -> list[LLMModelRead]:
    """Every model, optionally narrowed to one provider."""
    query = select(LLMModel).order_by(LLMModel.id)

    if provider_id is not None:
        query = query.where(LLMModel.provider_id == provider_id)

    if not include_inactive:
        query = query.where(LLMModel.is_active)

    return [
        LLMModelRead.model_validate(model) for model in session.scalars(query)
    ]


@router.get("/{model_id}")
def read_model(session: SessionDep, model_id: int) -> LLMModelRead:
    """One model by id."""
    return LLMModelRead.model_validate(get_or_404(session, model_id))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_model(session: SessionDep, body: LLMModelCreate) -> LLMModelRead:
    """Add a model under a provider."""
    require_provider(session, body.provider_id)
    reject_duplicate_name(session, body.provider_id, body.name)

    model = LLMModel(**body.model_dump())
    session.add(model)
    session.commit()
    session.refresh(model)

    return LLMModelRead.model_validate(model)


@router.patch("/{model_id}")
def update_model(
    session: SessionDep,
    model_id: int,
    body: LLMModelUpdate,
) -> LLMModelRead:
    """Change a model's name, prices, or whether it is active."""
    model = get_or_404(session, model_id)

    if body.name is not None:
        reject_duplicate_name(
            session,
            model.provider_id,
            body.name,
            exclude_id=model_id,
        )

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(model, field, value)

    session.commit()
    session.refresh(model)

    return LLMModelRead.model_validate(model)


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_model(session: SessionDep, model_id: int) -> None:
    """Retire a model.

    Deactivates rather than deletes: recorded usage still points at it,
    and that history has to stay readable.
    """
    model = get_or_404(session, model_id)
    model.is_active = False
    session.commit()
