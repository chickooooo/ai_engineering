# Instructions for AI agents

Follow these when changing anything in this repository.

- Ignore the `rough/` folder entirely — never read, change or reference it.
- Read [backend/instructions.md](backend/instructions.md) before touching
  `backend/`, and [frontend/instructions.md](frontend/instructions.md)
  before touching `frontend/`. Both apply on top of this file.
- Keep tooling config with the side it configures. Only files both sides
  share — the `Makefile`, `.gitignore`, `README.md` — belong at the root.
- Run every command through the `Makefile`. Add a `backend-` or
  `frontend-` target rather than documenting a bare command.
- Run `make quality` before finishing when a change touches both sides,
  and make all of it pass.
- Start both servers with `make start` and stop them with `make stop`.
  Never leave a server running when you are done.
- Keep the API contract in step on both sides in the same change: an
  endpoint's response shape, its tests, and the frontend type that
  mirrors it.
