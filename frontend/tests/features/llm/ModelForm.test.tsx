import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModelForm } from '../../../src/features/llm/ModelForm'
import { renderWithProviders } from '../../utils'

describe('<ModelForm />', () => {
  it('offers no provider to pick when there are none', () => {
    renderWithProviders(
      <ModelForm providers={[]} onClose={vi.fn<() => void>()} />,
    )

    expect(screen.getByLabelText('Provider')).toBeEmptyDOMElement()
  })

  it('starts every price at zero for a new model', () => {
    renderWithProviders(
      <ModelForm providers={[]} onClose={vi.fn<() => void>()} />,
    )

    expect(screen.getByLabelText('Input price')).toHaveValue(0)
    expect(screen.getByLabelText('Cached input price')).toHaveValue(0)
    expect(screen.getByLabelText('Cache write price')).toHaveValue(0)
    expect(screen.getByLabelText('Output price')).toHaveValue(0)
  })
})
