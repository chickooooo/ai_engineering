import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ApiError, apiGet } from '../../src/api/client'
import { server } from '../mocks/server'

describe('apiGet', () => {
  it('returns the parsed JSON body', async () => {
    server.use(http.get('/api/thing', () => HttpResponse.json({ id: 1 })))

    await expect(apiGet('/api/thing')).resolves.toEqual({ id: 1 })
  })

  it('throws an ApiError carrying the status on a failure', async () => {
    server.use(
      http.get('/api/thing', () => new HttpResponse(null, { status: 503 })),
    )

    await expect(apiGet('/api/thing')).rejects.toThrow(ApiError)
    await expect(apiGet('/api/thing')).rejects.toMatchObject({ status: 503 })
  })

  it('names the path in the error message', async () => {
    server.use(
      http.get('/api/thing', () => new HttpResponse(null, { status: 404 })),
    )

    await expect(apiGet('/api/thing')).rejects.toThrow('GET /api/thing failed')
  })
})
