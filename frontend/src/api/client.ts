const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** A request that reached the backend but came back as a failure. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  // Built up rather than spread, because `exactOptionalPropertyTypes`
  // will not take an explicit `undefined` for an optional field
  const init: RequestInit = { method }

  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' }
    init.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, init)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await failureMessage(response, method, path),
    )
  }

  // 204 carries no body, and neither does any response the caller ignores
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/** Prefer the backend's own explanation over a generic one. */
async function failureMessage(
  response: Response,
  method: string,
  path: string,
): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string'
    ) {
      return body.detail
    }
  } catch {
    // Not JSON, so fall through to the generic message
  }

  return `${method} ${path} failed`
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>('POST', path, body)
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PATCH', path, body)
}

export function apiDelete(path: string): Promise<void> {
  return request<void>('DELETE', path)
}
