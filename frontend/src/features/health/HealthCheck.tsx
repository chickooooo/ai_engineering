import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Field } from '../../components/ui/Field'
import { useHealth } from './useHealth'

const ENDPOINT = '/api/health'

/** A record panel for the backend, refreshed on demand. */
export function HealthCheck() {
  const { data, error, isFetching, refetch } = useHealth()

  return (
    <section className="max-w-2xl overflow-hidden rounded-lg border border-line bg-panel">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-tight">
            Backend status
          </h2>
          <p className="mt-0.5 truncate text-[12px] text-muted">
            Whether the API is up and answering.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isFetching ? 'Checking' : 'Check health'}
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-3">
        <Field label="Status">
          <span role="status" className="flex items-center gap-2">
            <span
              className={`size-1.5 shrink-0 rounded-full ${statusDotClass(Boolean(data), Boolean(error))}`}
              aria-hidden="true"
            />
            {statusLabel(data?.status, Boolean(error))}
          </span>
        </Field>

        <Field label="Last checked">
          <span className="font-mono text-muted">
            {data ? new Date(data.timestamp).toLocaleTimeString() : '—'}
          </span>
        </Field>

        <Field label="Endpoint">
          <span className="font-mono text-muted">{ENDPOINT}</span>
        </Field>
      </dl>

      {error ? (
        <p
          role="alert"
          className="flex items-center gap-2 border-t border-line bg-raised px-5 py-3 text-[12px] text-bad"
        >
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          Could not reach the backend: {error.message}
        </p>
      ) : null}
    </section>
  )
}

function statusLabel(status: string | undefined, failed: boolean): string {
  if (status) {
    return 'Healthy'
  }

  return failed ? 'Unreachable' : 'Not checked'
}

function statusDotClass(healthy: boolean, failed: boolean): string {
  if (healthy) {
    return 'bg-ok'
  }

  return failed ? 'bg-bad' : 'bg-muted'
}
