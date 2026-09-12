from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# Providers are named in caps, the way the rows read: ANTHROPIC, OPEN_AI
ProviderName = Field(min_length=1, max_length=50)


class ProviderCreate(BaseModel):
    """What a caller sends to add a provider."""

    name: str = ProviderName


class ProviderUpdate(BaseModel):
    """A partial change. Anything left out stays as it is."""

    name: str | None = Field(default=None, min_length=1, max_length=50)
    is_active: bool | None = None


class ProviderRead(BaseModel):
    """A provider as the API returns it."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_active: bool
    added_at: datetime
