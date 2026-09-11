# Instructions for AI agents

Follow these when changing anything in this repository.

Ignore the `rough/` folder entirely — never read, change or reference it.

## Tests

- Write unit tests for every change. This is not optional.
- Add tests for each new function, method and class in the same change.
- Update the existing tests when behaviour changes, and add a test for
  whatever the change made possible.
- Add a test that fails without the fix when fixing a bug.
- Mirror `src/` in `tests/`: one `test_<module>.py` per module, in the
  matching folder. Give every new test folder an `__init__.py`.
- Never let a test hit a real API or spend tokens. Replace provider SDK
  clients with the fakes in `tests/shared/conftest.py`, patched in through
  a `build_client` fixture, and add a fake there for any new provider.
- Put suite-wide fixtures in `tests/conftest.py` and folder-specific
  helpers in that folder's `conftest.py`.
- Cover the failure paths, not just the happy one: empty responses, SDK
  errors, and errors the code is *not* meant to swallow.

## Typing

- Keep `mypy` at zero errors. It runs in `strict` mode over the whole
  repository, tests included.
- Annotate every parameter and return value, in tests as well as in source.
  Write `-> None` on test functions; strict mode skips unannotated ones.
- Reach for a type parameter before reaching for `Any`.
- Write no `Any` in `src/shared/`, and none in `src/app/` beyond what
  pydantic forces.
- Prefer a precise union to a loose base class.
- Use `Literal` and `StrEnum` for values from a fixed set.
- Give every `# type: ignore` a specific error code and a comment saying
  why. Fix the types instead wherever that is possible.
- Use `Any` in tests only for the SDK fakes' `**kwargs`.

## Checks

- Run `make quality` before finishing, and make all of it pass.
- Run `make format` to fix what ruff can fix on its own.
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

## Structure

- Put all source under `src/`, and each group of endpoints in its own
  module in `src/app/routers/`.
- Import by package name (`from shared import Provider`), never by a path
  relative to `src/`.
- Add any new top-level package under `src/` to
  `[tool.hatch.build.targets.wheel]` in `pyproject.toml`, or it will not be
  installed.
- Add every new setting to `.env.example`. Never commit `.env`.

## Adding a provider client

1. Subclass `AIClient` in `src/shared/`, parameterised with the SDK client
   type — e.g. `class GeminiClient(AIClient[genai.Client])`.
2. Set `DEFAULT_MODEL`, and implement `_create_client`, `send_message` and
   `ping`. Make `ping` hit a metadata-only endpoint that costs no tokens.
3. Add a `Provider` member, an entry in `CLIENT_TYPES`, and the class to
   the `AnyAIClient` union in `src/shared/factory.py`.
4. Export it from `src/shared/__init__.py`.
5. Add a fake to `tests/shared/conftest.py` and a
   `tests/shared/test_<provider>_client.py` covering all three methods.
6. Document the new `AI_PROVIDER` value in `.env.example`.
