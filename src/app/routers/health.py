from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.config import Settings, get_settings
from shared import Provider, default_model

router = APIRouter(tags=["health"])

SettingsDep = Annotated[Settings, Depends(get_settings)]


class HealthResponse(BaseModel):
    """Body returned by the healthcheck."""

    status: Literal["ok"]
    provider: Provider
    model: str


@router.get("/health")
def healthcheck(settings: SettingsDep) -> HealthResponse:
    """Report that the service is up, and which provider it will use.

    Deliberately calls no provider API: this answers "is the service
    running", so it must not fail because someone else's API is down.
    """
    return HealthResponse(
        status="ok",
        provider=settings.ai_provider,
        model=default_model(settings.ai_provider),
    )
