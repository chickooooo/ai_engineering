import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../src/providers'

describe('<AppProviders />', () => {
  it('builds its own query client when none is passed', () => {
    render(
      <AppProviders>
        <p>inside</p>
      </AppProviders>,
    )

    expect(screen.getByText('inside')).toBeVisible()
  })
})
