from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from shared import Provider

# `.env` sits at the repo root, whatever directory the app runs from
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """Application settings, read from the environment and `.env`.

    An unknown `AI_PROVIDER` is rejected when these are first read, which
    `create_app` does at startup.
    """

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ai_provider: Provider = Provider.ANTHROPIC


@lru_cache
def get_settings() -> Settings:
    """Read the settings once and reuse them for the process's lifetime."""
    return Settings()
