import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { getHealth } from '../../src/api/health'
import { healthResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('getHealth', () => {
  it('returns the status and timestamp the backend reports', async () => {
    await expect(getHealth()).resolves.toEqual(healthResponse)
  })

  it('rejects when the backend is down', async () => {
    server.use(
      http.get('/api/health', () => new HttpResponse(null, { status: 500 })),
    )

    await expect(getHealth()).rejects.toThrow('GET /api/health failed')
  })
})
