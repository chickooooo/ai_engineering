import { HttpResponse, http } from 'msw'
import type { LLMModel } from '../../src/api/models'
import type { Provider } from '../../src/api/providers'

/** What the backend returns when it is up. */
export const healthResponse = {
  status: 'healthy',
  timestamp: '2026-09-12T06:00:00Z',
} as const

export const anthropic: Provider = {
  id: 1,
  name: 'ANTHROPIC',
  is_active: true,
  added_at: '2026-09-01T00:00:00Z',
}

export const openai: Provider = {
  id: 2,
  name: 'OPEN_AI',
  is_active: false,
  added_at: '2026-09-02T00:00:00Z',
}

export const haiku: LLMModel = {
  id: 10,
  provider_id: 1,
  name: 'claude-haiku-4-5',
  is_active: true,
  added_at: '2026-09-03T00:00:00Z',
  input_price: '1.000000',
  cached_input_price: '0.100000',
  cache_write_price: '1.250000',
  output_price: '5.000000',
}

/** The default responses every test starts from. */
export const handlers = [
  http.get('/api/health', () => HttpResponse.json(healthResponse)),
  http.get('/api/providers', () => HttpResponse.json([anthropic, openai])),
  http.get('/api/models', () => HttpResponse.json([haiku])),
  http.post('/api/providers', async ({ request }) => {
    const body = (await request.json()) as { name: string }

    return HttpResponse.json({ ...anthropic, id: 99, ...body }, { status: 201 })
  }),
  http.patch('/api/providers/:id', async ({ request }) => {
    const body = (await request.json()) as Partial<Provider>

    return HttpResponse.json({ ...anthropic, ...body })
  }),
  http.delete(
    '/api/providers/:id',
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post('/api/models', async ({ request }) => {
    const body = (await request.json()) as Partial<LLMModel>

    return HttpResponse.json({ ...haiku, id: 98, ...body }, { status: 201 })
  }),
  http.patch('/api/models/:id', async ({ request }) => {
    const body = (await request.json()) as Partial<LLMModel>

    return HttpResponse.json({ ...haiku, ...body })
  }),
  http.delete('/api/models/:id', () => new HttpResponse(null, { status: 204 })),
]
