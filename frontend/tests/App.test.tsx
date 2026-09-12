import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import { renderWithProviders } from './utils'

describe('<App />', () => {
  it('renders the health check on the home screen', () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole('heading', { name: 'AI Engineering' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Check backend health' }),
    ).toBeVisible()
  })
})
