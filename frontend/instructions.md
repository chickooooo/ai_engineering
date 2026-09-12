# Instructions for AI agents

Follow these when changing anything under `frontend/`. The repository
rules in [../instructions.md](../instructions.md) apply as well.

## Tests

- Write tests for every change. This is not optional.
- Add tests for each new component, hook and module in the same change.
- Update the existing tests when behaviour changes, and add a test for
  whatever the change made possible.
- Add a test that fails without the fix when fixing a bug.
- Mirror `src/` in `tests/`: one `<module>.test.ts` or `.test.tsx` per
  module, in the matching folder.
- Name each test so it states what it checks; the name is the docstring.
- Never let a test reach a real backend. Intercept every request with the
  MSW handlers in `tests/mocks/`, and add a handler there for any new
  endpoint. `onUnhandledRequest: 'error'` must stay on.
- Render through `renderWithProviders` from `tests/utils.tsx` so each test
  gets its own query client.
- Query the DOM the way a user would: by role, label or text. Never by
  class name or test id.
- Drive interactions with `userEvent`, not `fireEvent`.
- Cover the failure paths, not just the happy one: a failing request, an
  empty response, the pending state.

## Typing

- Keep `npm run typecheck` at zero errors. TypeScript runs with `strict`,
  `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, over the
  tests as well as `src/`.
- Never write `any`. Never silence an error with `@ts-expect-error` or a
  non-null assertion (`!`) without a comment saying why.
- Type what crosses the network boundary. Every endpoint gets an exported
  response type in `src/api/`, and it must match what the backend returns.
- Prefer a union of literals to `string` for a value from a fixed set.
- Let TypeScript infer local and return types; annotate the exported
  surface.

## Checks

- Run `make frontend-quality` before finishing, and make all of it pass.
- Run `make frontend-format` to fix what the linter and formatter can fix
  on their own.
- Read the coverage report and cover what the change added. Do not chase
  the total, and do not add a threshold.

## State management

- Put server state in TanStack Query. Anything the backend owns is fetched
  through a `useQuery` or `useMutation` hook, never into `useState`.
- Give each endpoint one hook in its feature folder, wrapping the `src/api`
  function. Components call the hook, never `fetch` directly.
- Keep query keys next to the hook that owns them, exported as a
  constant.
- Keep state that is only one component's business in `useState`.
- Reach for a client-state store only when state is genuinely shared and
  not server-owned. Add Zustand at that point; do not add it in advance.

## Conventions

- Format with Prettier: no semicolons, single quotes. Do not hand-format.
- Write function components and hooks. No classes.
- Keep `src/api/` free of React, and components free of `fetch`.
- Write comments that explain *why*, not *what*.

## Structure

- `src/api/` holds one module per backend resource, plus the shared
  request helper.
- `src/features/<feature>/` holds that feature's components and hooks.
- `src/components/` holds only what more than one feature uses.
- Reach the backend at a `/api`-prefixed path so the dev-server proxy
  handles it. Never hardcode an origin; `VITE_API_BASE_URL` overrides it.
- Add every new setting to `.env.example`. Never commit `.env`.

## Adding an endpoint

1. Add the response type and fetch function to a module in `src/api/`.
2. Add a hook in the owning `src/features/<feature>/` folder.
3. Add an MSW handler to `tests/mocks/handlers.ts`.
4. Add tests for the api module, the hook's component, and the failure
   path.
