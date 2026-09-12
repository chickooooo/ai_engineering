from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Body returned by the healthcheck."""

    status: Literal["healthy"]
    timestamp: datetime


@router.get("/health")
def healthcheck() -> HealthResponse:
    """Report that the service is up, and when it answered.

    Deliberately reads no settings and calls no provider API: this
    answers "is the service running", so it must not fail because
    someone else's API is down.
    """
    return HealthResponse(status="healthy", timestamp=datetime.now(UTC))
