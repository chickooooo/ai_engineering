.PHONY: quality start stop \
	backend-quality backend-lint backend-types backend-test backend-format \
	backend-run backend-install \
	frontend-quality frontend-lint frontend-types frontend-test \
	frontend-format frontend-run frontend-install

# An activated venv from an outer shell would make every `uv` call warn.
# The backend always uses backend/.venv, whatever shell you are in.
unexport VIRTUAL_ENV

BACKEND_PORT := 8080
FRONTEND_PORT := 5173
BACKEND_URL := http://127.0.0.1:$(BACKEND_PORT)
FRONTEND_URL := http://127.0.0.1:$(FRONTEND_PORT)
RUN_DIR := .run

# Every check on both sides, with a summary of what passed
quality:
	@./scripts/quality.sh

# - - - - - Backend - - - - -

backend-quality: backend-lint backend-types backend-test

backend-lint:
	@cd backend && uv run ruff check .
	@cd backend && uv run ruff format --check .

backend-types:
	@cd backend && uv run mypy .

# Reports coverage of everything under backend/src
backend-test:
	@cd backend && uv run pytest --cov --cov-report=term-missing

# Fix what ruff can fix on its own
backend-format:
	@cd backend && uv run ruff check --fix .
	@cd backend && uv run ruff format .

backend-install:
	@cd backend && uv sync

# Serve on $(BACKEND_URL), reloading on edit
backend-run:
	@cd backend && uv run uvicorn app.main:app --port $(BACKEND_PORT) --reload --reload-dir src

# - - - - - Frontend - - - - -

frontend-quality: frontend-lint frontend-types frontend-test

frontend-lint:
	@cd frontend && npm run --silent lint
	@cd frontend && npm run --silent format:check

frontend-types:
	@cd frontend && npm run --silent typecheck

# Reports coverage of everything under frontend/src
frontend-test:
	@cd frontend && npm run --silent test:coverage

# Fix what the linter and formatter can fix on their own
frontend-format:
	@cd frontend && npm run --silent lint:fix
	@cd frontend && npm run --silent format

frontend-install:
	cd frontend && npm install

# Serve on $(FRONTEND_URL), proxying /api to the backend
frontend-run:
	@cd frontend && npm run --silent dev

# - - - - - Both - - - - -

# Start both in the background; logs land in $(RUN_DIR)
start: stop
	@mkdir -p $(RUN_DIR)
	@( $(MAKE) backend-run > $(RUN_DIR)/backend.log 2>&1 & echo $$! > $(RUN_DIR)/backend.pid )
	@( $(MAKE) frontend-run > $(RUN_DIR)/frontend.log 2>&1 & echo $$! > $(RUN_DIR)/frontend.pid )
	@for _ in $$(seq 1 100); do \
		curl -sf $(BACKEND_URL)/health > /dev/null 2>&1 \
			&& curl -sf $(FRONTEND_URL) > /dev/null 2>&1 && break; \
		sleep 0.2; \
	done
	@curl -sf $(BACKEND_URL)/health > /dev/null 2>&1 \
		|| { echo "backend failed to start, see $(RUN_DIR)/backend.log"; exit 1; }
	@curl -sf $(FRONTEND_URL) > /dev/null 2>&1 \
		|| { echo "frontend failed to start, see $(RUN_DIR)/frontend.log"; exit 1; }
	@echo "backend  $(BACKEND_URL)  ($(RUN_DIR)/backend.log)"
	@echo "frontend $(FRONTEND_URL)  ($(RUN_DIR)/frontend.log)"

# Stop whatever `make start` left running, and wait for the ports to free
stop:
	@for pidfile in $(RUN_DIR)/*.pid; do \
		[ -f "$$pidfile" ] || continue; \
		pid=$$(cat $$pidfile); \
		pkill -P $$pid 2>/dev/null || true; \
		kill $$pid 2>/dev/null || true; \
		rm -f $$pidfile; \
	done
	@for port in $(BACKEND_PORT) $(FRONTEND_PORT); do \
		pids=$$(lsof -ti tcp:$$port 2>/dev/null); \
		[ -z "$$pids" ] || kill $$pids 2>/dev/null || true; \
	done
	@for port in $(BACKEND_PORT) $(FRONTEND_PORT); do \
		for _ in $$(seq 1 50); do \
			lsof -ti tcp:$$port > /dev/null 2>&1 || break; \
			sleep 0.1; \
		done; \
	done
	@echo "stopped"
