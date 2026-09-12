import { Activity, CircleAlert, Loader2 } from 'lucide-react'
import { useHealth } from './useHealth'

/** A card that asks the backend how it is, and shows the answer. */
export function HealthCheck() {
  const { data, error, isFetching, refetch } = useHealth()

  return (
    <section className="max-w-xl rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-raised text-primary">
          <Activity className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">
            Backend status
          </h2>
          <p className="mt-1 text-sm text-muted">
            Ask the API whether it is up and answering.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isFetching}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isFetching ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {isFetching ? 'Checking…' : 'Check backend health'}
      </button>

      {error ? (
        <p
          role="alert"
          className="mt-5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          Could not reach the backend: {error.message}
        </p>
      ) : null}

      {data ? (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
        >
          <span
            className="size-2 shrink-0 rounded-full bg-emerald-400"
            aria-hidden="true"
          />
          Backend is {data.status}, as of{' '}
          <span className="text-muted">
            {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </p>
      ) : null}
    </section>
  )
}
