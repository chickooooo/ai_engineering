import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import { renderWithProviders } from './utils'

describe('<App />', () => {
  it('renders the home screen inside the app shell', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { name: 'Home' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })

  it('puts the health check on the home screen', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('button', { name: 'Check health' })).toBeVisible()
  })
})
