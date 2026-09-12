import { render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AppProviders } from '../src/providers'
import { createQueryClient } from '../src/queryClient'

type Options = {
  /** Where the router should start, for a test that opens a page direct. */
  route?: string
}

type Rendered = RenderResult & { user: ReturnType<typeof userEvent.setup> }

/** Render `ui` inside the app's providers, with state isolated per test. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: Options = {},
): Rendered {
  const user = userEvent.setup()
  const result = render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        <AppProviders client={createQueryClient()}>{children}</AppProviders>
      </MemoryRouter>
    ),
  })

  return { ...result, user }
}
