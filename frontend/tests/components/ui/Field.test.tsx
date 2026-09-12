import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field } from '../../../src/components/ui/Field'

describe('<Field />', () => {
  it('shows the label above its value', () => {
    render(<Field label="Client number">N1200000</Field>)

    expect(screen.getByText('Client number')).toBeVisible()
    expect(screen.getByText('N1200000')).toBeVisible()
  })
})
