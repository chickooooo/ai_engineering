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
- Every check runs inside its container, so Docker is the only thing a
  contributor needs. Keep it that way: a new check goes through
  `$(BACKEND_RUN)` or `$(FRONTEND_RUN)`, never a bare host command.
- Run `make quality` before finishing when a change touches both sides,
  and make all of it pass.
- Run the app in Docker: `make docker up` starts the database, backend and
  frontend together, `make docker down` stops them. Never start a server
  outside a container.
- Put compose secrets in the root `.env` and add every new one to
  `.env.example`. The backend's provider keys stay in `backend/.env`.
- Keep the Postgres data in `.docker/postgres`. Never delete it, and never
  run `docker compose down -v`, without the user asking.
- Both services reload from the bind-mounted source, so a code change needs
  no rebuild. Rebuild (`make docker up`) only after changing a Dockerfile
  or a dependency file.
- Keep the API contract in step on both sides in the same change: an
  endpoint's response shape, its tests, and the frontend type that
  mirrors it.
