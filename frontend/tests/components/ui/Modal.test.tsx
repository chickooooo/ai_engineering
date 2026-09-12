import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '../../../src/components/ui/Modal'
import { renderWithProviders } from '../../utils'

describe('<Modal />', () => {
  it('names itself for a screen reader', () => {
    renderWithProviders(
      <Modal title="New provider" onClose={vi.fn<() => void>()}>
        body
      </Modal>,
    )

    expect(screen.getByRole('dialog', { name: 'New provider' })).toBeVisible()
  })

  it('closes on the close button', async () => {
    const onClose = vi.fn<() => void>()
    const { user } = renderWithProviders(
      <Modal title="New provider" onClose={onClose}>
        body
      </Modal>,
    )

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn<() => void>()
    const { user } = renderWithProviders(
      <Modal title="New provider" onClose={onClose}>
        body
      </Modal>,
    )

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores other keys', async () => {
    const onClose = vi.fn<() => void>()
    const { user } = renderWithProviders(
      <Modal title="New provider" onClose={onClose}>
        body
      </Modal>,
    )

    await user.keyboard('{Enter}')

    expect(onClose).not.toHaveBeenCalled()
  })
})
