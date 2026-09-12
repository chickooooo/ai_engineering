import { screen } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { HealthCheck } from '../../../src/features/health/HealthCheck'
import { server } from '../../mocks/server'
import { renderWithProviders } from '../../utils'

describe('<HealthCheck />', () => {
  it('starts unchecked, with the button ready', () => {
    renderWithProviders(<HealthCheck />)

    expect(screen.getByRole('button', { name: 'Check health' })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Not checked')
  })

  it('shows the endpoint it will call', () => {
    renderWithProviders(<HealthCheck />)

    expect(screen.getByText('/api/health')).toBeVisible()
  })

  it('reports the backend as healthy once the button is clicked', async () => {
    const { user } = renderWithProviders(<HealthCheck />)

    await user.click(screen.getByRole('button'))

    expect(await screen.findByText('Healthy')).toBeVisible()
  })

  it('shows when the check last ran', async () => {
    const { user } = renderWithProviders(<HealthCheck />)
    expect(screen.getByText('—')).toBeVisible()

    await user.click(screen.getByRole('button'))
    await screen.findByText('Healthy')

    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('asks the backend only when the button is clicked', async () => {
    let calls = 0
    server.use(
      http.get('/api/health', () => {
        calls += 1
        return HttpResponse.json({
          status: 'healthy',
          timestamp: '2026-01-01T00:00:00Z',
        })
      }),
    )

    const { user } = renderWithProviders(<HealthCheck />)
    expect(calls).toBe(0)

    await user.click(screen.getByRole('button'))
    await screen.findByText('Healthy')

    expect(calls).toBe(1)
  })

  it('disables the button and says so while the request is in flight', async () => {
    server.use(
      http.get('/api/health', async () => {
        await delay(50)
        return HttpResponse.json({
          status: 'healthy',
          timestamp: '2026-01-01T00:00:00Z',
        })
      }),
    )

    const { user } = renderWithProviders(<HealthCheck />)
    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button', { name: 'Checking' })).toBeDisabled()
    expect(await screen.findByText('Healthy')).toBeVisible()
  })

  it('reports the backend as unreachable when the call fails', async () => {
    server.use(
      http.get('/api/health', () => new HttpResponse(null, { status: 503 })),
    )

    const { user } = renderWithProviders(<HealthCheck />)
    await user.click(screen.getByRole('button'))

    expect(await screen.findByText('Unreachable')).toBeVisible()
  })

  it('explains the failure in an alert', async () => {
    server.use(
      http.get('/api/health', () => new HttpResponse(null, { status: 503 })),
    )

    const { user } = renderWithProviders(<HealthCheck />)
    await user.click(screen.getByRole('button'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Could not reach the backend/,
    )
  })
})
