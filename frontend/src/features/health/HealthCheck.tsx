import { useHealth } from './useHealth'

/** A button that asks the backend how it is, and shows the answer. */
export function HealthCheck() {
  const { data, error, isFetching, refetch } = useHealth()

  return (
    <section>
      <h1>AI Engineering</h1>

      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isFetching}
      >
        {isFetching ? 'Checking…' : 'Check backend health'}
      </button>

      {error ? (
        <p role="alert">Could not reach the backend: {error.message}</p>
      ) : null}

      {data ? (
        <p role="status">
          Backend is {data.status}, as of{' '}
          {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      ) : null}
    </section>
  )
}
