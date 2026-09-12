import { HttpResponse, http } from 'msw'

/** What the backend returns when it is up. */
export const healthResponse = {
  status: 'healthy',
  timestamp: '2026-09-12T06:00:00Z',
} as const

/** The default responses every test starts from. */
export const handlers = [
  http.get('/api/health', () => HttpResponse.json(healthResponse)),
]
