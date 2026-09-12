import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Sidebar } from '../../../src/components/layout/Sidebar'

describe('<Sidebar />', () => {
  it('shows the product name', () => {
    render(<Sidebar />)

    expect(screen.getByText('AI Engineering')).toBeVisible()
  })

  it('offers a Home tab', () => {
    render(<Sidebar />)

    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible()
  })

  it('marks Home as the page being viewed', () => {
    render(<Sidebar />)

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('labels its navigation so it can be skipped to', () => {
    render(<Sidebar />)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })

  it('starts expanded', () => {
    render(<Sidebar />)

    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('hides the labels when collapsed', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(screen.queryByText('AI Engineering')).not.toBeInTheDocument()
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument()
    expect(screen.queryByText('Version')).not.toBeInTheDocument()
  })

  it('keeps the tabs reachable when collapsed', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    const home = screen.getByRole('link', { name: 'Home' })

    expect(home).toBeVisible()
    expect(home).toHaveAttribute('title', 'Home')
  })

  it('expands again when the toggle is clicked back', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))

    expect(screen.getByText('AI Engineering')).toBeVisible()
  })
})
