import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Sidebar } from '../../../src/components/layout/Sidebar'
import { renderWithProviders } from '../../utils'

describe('<Sidebar />', () => {
  it('shows the product name', () => {
    renderWithProviders(<Sidebar />)

    expect(screen.getByText('AI Engineering')).toBeVisible()
  })

  it('offers a tab for each screen', () => {
    renderWithProviders(<Sidebar />)

    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Manage Models' })).toBeVisible()
  })

  it('marks the tab for the current route', () => {
    renderWithProviders(<Sidebar />, { route: '/models' })

    expect(screen.getByRole('link', { name: 'Manage Models' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('marks Home when that is the route', () => {
    renderWithProviders(<Sidebar />, { route: '/' })

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('labels its navigation so it can be skipped to', () => {
    renderWithProviders(<Sidebar />)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })

  it('starts expanded', () => {
    renderWithProviders(<Sidebar />)

    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('hides the labels when collapsed', async () => {
    const { user } = renderWithProviders(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(screen.queryByText('AI Engineering')).not.toBeInTheDocument()
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument()
    expect(screen.queryByText('Version')).not.toBeInTheDocument()
  })

  it('keeps the tabs reachable when collapsed', async () => {
    const { user } = renderWithProviders(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    const home = screen.getByRole('link', { name: 'Home' })

    expect(home).toBeVisible()
    expect(home).toHaveAttribute('title', 'Home')
  })

  it('expands again when the toggle is clicked back', async () => {
    const { user } = renderWithProviders(<Sidebar />)

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))

    expect(screen.getByText('AI Engineering')).toBeVisible()
  })
})
