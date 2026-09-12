.PHONY: quality docker up down docker-up docker-down \
	backend-quality backend-lint backend-types backend-test backend-format \
	backend-install backend-migrate backend-migration backend-seed \
	frontend-quality frontend-lint frontend-types frontend-test \
	frontend-format frontend-install

# An activated venv from an outer shell would make every `uv` call warn.
# The backend always uses backend/.venv, whatever shell you are in.
unexport VIRTUAL_ENV

BACKEND_PORT := 8080
FRONTEND_PORT := 5173
POSTGRES_PORT := 5432
BACKEND_URL := http://127.0.0.1:$(BACKEND_PORT)
FRONTEND_URL := http://127.0.0.1:$(FRONTEND_PORT)

# Every check runs in its container, so Docker is the only thing a
# contributor needs installed. --no-deps skips starting the database for
# the checks that do not touch it.
BACKEND_RUN := docker compose run --rm --no-deps backend
FRONTEND_RUN := docker compose run --rm --no-deps frontend

# Every check on both sides, with a summary of what passed
quality:
	@./scripts/quality.sh

# - - - - - Backend - - - - -

backend-quality: backend-lint backend-types backend-test

backend-lint:
	@$(BACKEND_RUN) uv run ruff check .
	@$(BACKEND_RUN) uv run ruff format --check .

backend-types:
	@$(BACKEND_RUN) uv run mypy .

# Runs in the container, against a throwaway database the suite migrates
# and drops for itself
backend-test:
	@docker compose run --rm backend uv run pytest --cov --cov-report=term-missing

# Put the providers and their default models into the database
backend-seed:
	@docker compose run --rm backend uv run python -m app.seed

# Bring the database up to the latest migration
backend-migrate:
	@docker compose run --rm backend uv run alembic upgrade head

# Write a migration from the difference between the models and the database:
#   make backend-migration m="Add chat tables"
backend-migration:
	@test -n "$(m)" || { echo 'usage: make backend-migration m="what changed"'; exit 1; }
	@docker compose run --rm backend uv run alembic revision --autogenerate -m "$(m)"
	@$(MAKE) --no-print-directory backend-format

# Fix what ruff can fix on its own
backend-format:
	@$(BACKEND_RUN) uv run ruff format .
	@$(BACKEND_RUN) uv run ruff check --fix .

# Host-side toolchain, for editor support only. The checks use Docker.
backend-install:
	@cd backend && uv sync

# - - - - - Frontend - - - - -

frontend-quality: frontend-lint frontend-types frontend-test

frontend-lint:
	@$(FRONTEND_RUN) npm run --silent lint
	@$(FRONTEND_RUN) npm run --silent format:check

frontend-types:
	@$(FRONTEND_RUN) npm run --silent typecheck

# Needs no backend, so it skips starting one
frontend-test:
	@$(FRONTEND_RUN) npm run --silent test:coverage

# Fix what the linter and formatter can fix on their own
frontend-format:
	@$(FRONTEND_RUN) npm run --silent lint:fix
	@$(FRONTEND_RUN) npm run --silent format

# Host-side toolchain, for editor support only. The checks use Docker.
frontend-install:
	@cd frontend && npm install

# - - - - - Both - - - - -

# `make docker up` and `make docker down`. `up` and `down` are goals in
# their own right to make, so they are declared as no-ops below.
DOCKER_ACTION := $(filter up down,$(MAKECMDGOALS))

docker:
ifeq ($(DOCKER_ACTION),)
	@echo "usage: make docker up   |   make docker down"
	@exit 1
else
	@$(MAKE) --no-print-directory docker-$(DOCKER_ACTION)
endif

up down:
	@:

# Build what changed and start every service in the background
docker-up:
	@docker compose up --build --detach --wait
	@echo "backend   $(BACKEND_URL)"
	@echo "frontend  $(FRONTEND_URL)"
	@echo "database  postgres://localhost:$(POSTGRES_PORT)"

# Stop and remove the containers. The database files stay in .docker/
docker-down:
	@docker compose down --remove-orphans
