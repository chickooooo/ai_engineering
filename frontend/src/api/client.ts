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

/** GET `path` and parse the JSON body, throwing `ApiError` on a failure. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`)

  if (!response.ok) {
    throw new ApiError(response.status, `GET ${path} failed`)
  }

  return (await response.json()) as T
}
