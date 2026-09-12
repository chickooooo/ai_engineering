FROM python:3.12-slim

# The same resolver as local development, so the lockfile is authoritative
COPY --from=ghcr.io/astral-sh/uv:0.9.10 /uv /usr/local/bin/uv

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app

# Dependencies first, so editing source does not invalidate this layer
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen

EXPOSE 8080

# No watchfiles installed, so --reload polls, which is what a bind mount
# from the host needs
CMD ["uv", "run", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", "--port", "8080", \
     "--reload", "--reload-dir", "src"]
