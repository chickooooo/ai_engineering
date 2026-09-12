import { apiDelete, apiGet, apiPatch, apiPost } from './client'

/** A provider as the API returns it. */
export type Provider = {
  id: number
  name: string
  is_active: boolean
  added_at: string
}

export type ProviderCreate = {
  name: string
}

export type ProviderUpdate = {
  name?: string
  is_active?: boolean
}

export function listProviders(): Promise<Provider[]> {
  return apiGet<Provider[]>('/api/providers')
}

export function createProvider(body: ProviderCreate): Promise<Provider> {
  return apiPost<Provider>('/api/providers', body)
}

export function updateProvider(
  id: number,
  body: ProviderUpdate,
): Promise<Provider> {
  return apiPatch<Provider>(`/api/providers/${id}`, body)
}

/** Retires the provider; the backend keeps the row for its usage history. */
export function deactivateProvider(id: number): Promise<void> {
  return apiDelete(`/api/providers/${id}`)
}
