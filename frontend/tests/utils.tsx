import { render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { AppProviders } from '../src/providers'
import { createQueryClient } from '../src/queryClient'

type Rendered = RenderResult & { user: ReturnType<typeof userEvent.setup> }

/** Render `ui` inside the app's providers, with state isolated per test. */
export function renderWithProviders(ui: ReactElement): Rendered {
  const user = userEvent.setup()
  const result = render(ui, {
    wrapper: ({ children }) => (
      <AppProviders client={createQueryClient()}>{children}</AppProviders>
    ),
  })

  return { ...result, user }
}
