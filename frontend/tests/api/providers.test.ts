import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  createProvider,
  deactivateProvider,
  listProviders,
  updateProvider,
} from '../../src/api/providers'
import { anthropic } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('the providers api', () => {
  it('lists what the backend returns', async () => {
    const providers = await listProviders()

    expect(providers[0]?.name).toBe('ANTHROPIC')
  })

  it('sends the new name on create', async () => {
    let sent: unknown
    server.use(
      http.post('/api/providers', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(anthropic, { status: 201 })
      }),
    )

    await createProvider({ name: 'GEMINI' })

    expect(sent).toEqual({ name: 'GEMINI' })
  })

  it('sends only the changed fields on update', async () => {
    let sent: unknown
    server.use(
      http.patch('/api/providers/1', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(anthropic)
      }),
    )

    await updateProvider(1, { is_active: false })

    expect(sent).toEqual({ is_active: false })
  })

  it('accepts the empty body a delete returns', async () => {
    await expect(deactivateProvider(1)).resolves.toBeUndefined()
  })

  it('surfaces the backend’s own explanation of a failure', async () => {
    server.use(
      http.post('/api/providers', () =>
        HttpResponse.json(
          { detail: "A provider named 'ANTHROPIC' already exists" },
          { status: 409 },
        ),
      ),
    )

    await expect(createProvider({ name: 'ANTHROPIC' })).rejects.toThrow(
      /already exists/,
    )
  })

  it('falls back to a generic message when the body has no detail', async () => {
    server.use(
      http.post('/api/providers', () =>
        HttpResponse.json({ oops: true }, { status: 500 }),
      ),
    )

    await expect(createProvider({ name: 'X' })).rejects.toThrow(
      'POST /api/providers failed',
    )
  })

  it('falls back to a generic message when the body is not JSON', async () => {
    server.use(
      http.post(
        '/api/providers',
        () => new HttpResponse('nope', { status: 500 }),
      ),
    )

    await expect(createProvider({ name: 'X' })).rejects.toThrow(
      'POST /api/providers failed',
    )
  })
})
