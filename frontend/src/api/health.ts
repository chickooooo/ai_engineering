import { apiGet } from './client'

/** Body the backend's `/health` endpoint returns. */
export type Health = {
  status: 'healthy'
  timestamp: string
}

/** Ask the backend whether it is up. */
export function getHealth(): Promise<Health> {
  return apiGet<Health>('/api/health')
}
