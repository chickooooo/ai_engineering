from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

# Prices are USD per million tokens, and cannot be negative
Price = Field(default=Decimal(0), ge=0, max_digits=12, decimal_places=6)
OptionalPrice = Field(default=None, ge=0, max_digits=12, decimal_places=6)


class LLMModelCreate(BaseModel):
    """What a caller sends to add a model."""

    provider_id: int
    name: str = Field(min_length=1, max_length=100)
    input_price: Decimal = Price
    cached_input_price: Decimal = Price
    cache_write_price: Decimal = Price
    output_price: Decimal = Price


class LLMModelUpdate(BaseModel):
    """A partial change. Anything left out stays as it is."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None
    input_price: Decimal | None = OptionalPrice
    cached_input_price: Decimal | None = OptionalPrice
    cache_write_price: Decimal | None = OptionalPrice
    output_price: Decimal | None = OptionalPrice


class LLMModelRead(BaseModel):
    """A model as the API returns it."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    provider_id: int
    name: str
    is_active: bool
    added_at: datetime
    input_price: Decimal
    cached_input_price: Decimal
    cache_write_price: Decimal
    output_price: Decimal
