.PHONY: quality lint types test format run

# Run every check: linting, type checking and the test suite
quality: lint types test

lint:
	uv run ruff check .
	uv run ruff format --check .

types:
	uv run mypy .

# Reports coverage of everything under src/
test:
	uv run pytest --cov --cov-report=term-missing

# Fix what ruff can fix on its own
format:
	uv run ruff check --fix .
	uv run ruff format .

# Start the development server on http://127.0.0.1:8000, reloading on edit
run:
	uv run uvicorn app.main:app --reload --reload-dir src
