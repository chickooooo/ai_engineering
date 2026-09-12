from fastapi import FastAPI

from app.config import get_settings
from app.routers import health, llm_models, providers, root


def create_app() -> FastAPI:
    """Build the FastAPI application and mount its routers."""
    # Read the settings up front, so a bad `.env` stops the app from
    # starting instead of failing the first request that reads it
    get_settings()

    app = FastAPI(
        title="AI Engineering",
        version="0.1.0",
    )
    app.include_router(root.router)
    app.include_router(health.router)
    app.include_router(providers.router)
    app.include_router(llm_models.router)

    return app


app = create_app()
