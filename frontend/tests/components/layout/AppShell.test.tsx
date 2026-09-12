import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from '../../../src/components/layout/AppShell'

describe('<AppShell />', () => {
  it('shows the given title as the page heading', () => {
    render(<AppShell title="Reports">content</AppShell>)

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeVisible()
  })

  it('renders its children in the main region', () => {
    render(
      <AppShell title="Home">
        <p>the page</p>
      </AppShell>,
    )

    expect(screen.getByRole('main')).toHaveTextContent('the page')
  })

  it('always shows the sidebar', () => {
    render(<AppShell title="Home">content</AppShell>)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })
})
