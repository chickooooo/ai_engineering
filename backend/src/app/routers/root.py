from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["root"])


class WelcomeResponse(BaseModel):
    """Body returned by the root endpoint."""

    message: str


@router.get("/")
def welcome() -> WelcomeResponse:
    """Greet whoever lands on the root of the API."""
    return WelcomeResponse(message="Welcome to the AI Engineering service!")
