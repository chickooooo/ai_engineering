# Instructions for AI agents

Follow these when changing anything under `backend/`. The repository
rules in [../instructions.md](../instructions.md) apply as well.

## Tests

- Write unit tests for every change. This is not optional.
- Add tests for each new function, method and class in the same change.
- Update the existing tests when behaviour changes, and add a test for
  whatever the change made possible.
- Add a test that fails without the fix when fixing a bug.
- Give every test a one-line docstring saying what it checks.
- Mirror `src/` in `tests/` for unit tests: one `test_<module>.py` per
  module, in the matching folder. Give every new test folder an
  `__init__.py`.
- Never let a test hit a real API or spend tokens, integration tests
  included.
- Keep the provider SDK fakes in `tests/fakes/`, one module per provider,
  and add one there for any new provider.
- Expose each fake through a fixture that patches the SDK, in
  `tests/ai_clients/conftest.py`. Import fakes from `tests.fakes`, never from
  a `conftest` module.
- Put suite-wide fixtures in `tests/conftest.py` and folder-specific
  helpers in that folder's `conftest.py`.
- Cover the failure paths, not just the happy one: empty responses, SDK
  errors, and errors the code is *not* meant to swallow.

## Integration tests

- Put them in `tests/integration/`, outside the mirrored folders.
- Write one whenever a change crosses a seam between modules — settings to
  app, app to a client, a router to the factory.
- Wire the real modules together: no fakes, no dependency overrides, and
  drive them through the same surface a caller would (the environment, the
  HTTP endpoint).
- Keep them offline. Arrange them so they need no API key beyond the dummy
  one the suite plants.
- Leave the mirrored unit tests in place; an integration test adds to them
  rather than replacing them.

## Typing

- Keep `mypy` at zero errors. It runs in `strict` mode over the whole
  repository, tests included.
- Annotate every parameter and return value, in tests as well as in source.
  Write `-> None` on test functions; strict mode skips unannotated ones.
- Reach for a type parameter before reaching for `Any`.
- Write no `Any` in `src/ai_clients/`, and none in `src/app/` beyond what
  pydantic forces.
- Prefer a precise union to a loose base class.
- Use `Literal` and `StrEnum` for values from a fixed set.
- Give every `# type: ignore` a specific error code and a comment saying
  why. Fix the types instead wherever that is possible.
- Use `Any` in tests only for the SDK fakes' `**kwargs`.

## Checks

- Run `make backend-quality` before finishing, and make all of it pass.
- Every check runs inside the container, the tests against the real
  Postgres. Use the `make` targets, never a bare `ruff`, `mypy` or
  `pytest`.
- Run `make backend-format` to fix what ruff can fix on its own.
- Read the **Missing** column of the coverage report and cover what the
  change added. Do not chase the total, and do not add a threshold.
- Fix the cause when a warning fails the suite. Add an `ignore` to
  `filterwarnings` only for a warning raised inside a dependency that we
  cannot fix, with a comment saying what would let the line be removed.

## Conventions

- Keep lines to 79 characters. Wrap rather than let a line run long.
- Write Python 3.12 idioms: PEP 695 generics (`class AIClient[ClientT]:`)
  and type aliases (`type AnyAIClient = ...`) rather than
  `Generic`/`TypeVar`/`TypeAlias`, and `StrEnum` rather than `(str, Enum)`.
- Manage dependencies with `uv add <package>`, never by hand-editing
  `pyproject.toml`. Refresh them with `uv lock --upgrade`, and bump the
  `>=` floors to match what you resolved and tested against.
- Catch the provider SDK's own base exception (`anthropic.AnthropicError`,
  `openai.OpenAIError`), never a bare `Exception`. Let unrelated errors
  reach the caller.
- Write comments that explain *why*, not *what*. Match the density of the
  surrounding code.

## Database

- Read the connection string from `Settings.database_url`; never build one
  from parts or read `DATABASE_URL` directly.
- Define every table as a model in `src/app/models/`, and change the schema
  only through a migration. Write it with
  `make backend-migration m="what changed"`, then read what Alembic
  generated before committing it.
- Apply migrations with `make backend-migrate`. Never create tables from
  `Base.metadata.create_all`.
- Put reference rows the app needs in `src/app/seed.py`, applied with
  `make backend-seed`. Keep it idempotent, and never seed a price: no
  provider publishes rates over its API, so they are entered by hand.
- Tests run against a throwaway database that the suite creates, migrates
  and drops for itself. Never point them at the development database, and
  never work around leftover rows — there are none.
- Drop any Postgres enum type the migration created in its `downgrade`.
  SQLAlchemy creates the type with the table but Alembic generates no drop,
  and the next upgrade then fails on a type that already exists.
- Check a migration both ways before committing it: `alembic downgrade
  base` followed by `alembic upgrade head` must both succeed.
- Keep prompt and completion text in `LLMMessageContent`, never on
  `LLMMessage`; usage queries must not be able to read it.
- Take the engine from `get_engine()`, which is cached for the process.
  Never call `create_engine` anywhere else.
- Take a session through the `get_session` dependency so it closes with the
  request.
- Put anything that needs a live database in `tests/integration/`, and take
  the `session` fixture so the writes roll back.
- Write tests that assume empty tables. Ids start at 1 on every run.
- Dispose an engine a test created; a connection left open fails a later
  test through `filterwarnings = error`.

## Structure

- Put all source under `src/`, and each group of endpoints in its own
  module in `src/app/routers/`.
- Import by package name (`from ai_clients import Provider`), never by a path
  relative to `src/`.
- Add any new top-level package under `src/` to
  `[tool.hatch.build.targets.wheel]` in `pyproject.toml`, or it will not be
  installed.
- Add every new setting to `.env.example`. Never commit `.env`.

## Adding a provider client

1. Subclass `AIClient` in `src/ai_clients/`, parameterised with the SDK client
   type — e.g. `class GeminiClient(AIClient[genai.Client])`.
2. Set `DEFAULT_MODEL`, and implement `_create_client`, `send_message` and
   `ping`. Make `ping` hit a metadata-only endpoint that costs no tokens.
3. Add a `Provider` member, an entry in `CLIENT_TYPES`, and the class to
   the `AnyAIClient` union in `src/ai_clients/factory.py`.
4. Export it from `src/ai_clients/__init__.py`.
5. Add a fake to `tests/fakes/`, a fixture patching it in to
   `tests/ai_clients/conftest.py`, and a
   `tests/ai_clients/test_<provider>_client.py` covering all three methods.
6. Document the new `AI_PROVIDER` value in `.env.example`.
