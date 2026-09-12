import { render, screen } from '@testing-library/react'
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
})
