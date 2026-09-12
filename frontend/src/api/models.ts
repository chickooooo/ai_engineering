import { apiDelete, apiGet, apiPatch, apiPost } from './client'

/**
 * A model as the API returns it.
 *
 * Prices are decimal strings, per million tokens. They stay strings so
 * that no rate is mangled by a float on the way through.
 */
export type LLMModel = {
  id: number
  provider_id: number
  name: string
  is_active: boolean
  added_at: string
  input_price: string
  cached_input_price: string
  cache_write_price: string
  output_price: string
}

export type LLMModelCreate = {
  provider_id: number
  name: string
  input_price: string
  cached_input_price: string
  cache_write_price: string
  output_price: string
}

export type LLMModelUpdate = Partial<Omit<LLMModelCreate, 'provider_id'>> & {
  is_active?: boolean
}

export function listModels(): Promise<LLMModel[]> {
  return apiGet<LLMModel[]>('/api/models')
}

export function createModel(body: LLMModelCreate): Promise<LLMModel> {
  return apiPost<LLMModel>('/api/models', body)
}

export function updateModel(
  id: number,
  body: LLMModelUpdate,
): Promise<LLMModel> {
  return apiPatch<LLMModel>(`/api/models/${id}`, body)
}

/** Retires the model; the backend keeps the row for its usage history. */
export function deactivateModel(id: number): Promise<void> {
  return apiDelete(`/api/models/${id}`)
}
