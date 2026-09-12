.PHONY: quality start stop \
	backend-quality backend-lint backend-types backend-test backend-format \
	backend-run backend-install \
	frontend-quality frontend-lint frontend-types frontend-test \
	frontend-format frontend-run frontend-install

BACKEND_URL := http://127.0.0.1:8080
FRONTEND_URL := http://127.0.0.1:5173
RUN_DIR := .run

# Every check on both sides
quality: backend-quality frontend-quality

# - - - - - Backend - - - - -

backend-quality: backend-lint backend-types backend-test

backend-lint:
	cd backend && uv run ruff check .
	cd backend && uv run ruff format --check .

backend-types:
	cd backend && uv run mypy .

# Reports coverage of everything under backend/src
backend-test:
	cd backend && uv run pytest --cov --cov-report=term-missing

# Fix what ruff can fix on its own
backend-format:
	cd backend && uv run ruff check --fix .
	cd backend && uv run ruff format .

backend-install:
	cd backend && uv sync

# Serve on $(BACKEND_URL), reloading on edit
backend-run:
	cd backend && uv run uvicorn app.main:app --port 8080 --reload --reload-dir src

# - - - - - Frontend - - - - -

frontend-quality: frontend-lint frontend-types frontend-test

frontend-lint:
	cd frontend && npm run lint
	cd frontend && npm run format:check

frontend-types:
	cd frontend && npm run typecheck

# Reports coverage of everything under frontend/src
frontend-test:
	cd frontend && npm run test:coverage

# Fix what the linter and formatter can fix on their own
frontend-format:
	cd frontend && npm run lint:fix
	cd frontend && npm run format

frontend-install:
	cd frontend && npm install

# Serve on $(FRONTEND_URL), proxying /api to the backend
frontend-run:
	cd frontend && npm run dev

# - - - - - Both - - - - -

# Start both in the background; logs land in $(RUN_DIR)
start: stop
	@mkdir -p $(RUN_DIR)
	@( $(MAKE) backend-run > $(RUN_DIR)/backend.log 2>&1 & echo $$! > $(RUN_DIR)/backend.pid )
	@( $(MAKE) frontend-run > $(RUN_DIR)/frontend.log 2>&1 & echo $$! > $(RUN_DIR)/frontend.pid )
	@echo "backend  $(BACKEND_URL)  ($(RUN_DIR)/backend.log)"
	@echo "frontend $(FRONTEND_URL)  ($(RUN_DIR)/frontend.log)"

# Stop whatever `make start` left running
stop:
	@for pidfile in $(RUN_DIR)/*.pid; do \
		[ -f "$$pidfile" ] || continue; \
		pid=$$(cat $$pidfile); \
		pkill -P $$pid 2>/dev/null || true; \
		kill $$pid 2>/dev/null || true; \
		rm -f $$pidfile; \
	done
	@pkill -f "uvicorn app.main:app" 2>/dev/null || true
	@pkill -f "vite --port|node .*vite" 2>/dev/null || true
	@echo "stopped"
