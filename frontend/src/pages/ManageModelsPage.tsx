import { useSearchParams } from 'react-router'
import { AppShell } from '../components/layout/AppShell'
import { Tabs } from '../components/ui/Tabs'
import { ModelsPanel } from '../features/llm/ModelsPanel'
import { ProvidersPanel } from '../features/llm/ProvidersPanel'
import { useModels, useProviders } from '../features/llm/queries'

const VIEWS = ['providers', 'models'] as const

type View = (typeof VIEWS)[number]

export function ManageModelsPage() {
  return (
    <AppShell title="Manage Models">
      <ManageModels />
    </AppShell>
  )
}

/** Split out so the page can return early without repeating the shell. */
function ManageModels() {
  const providers = useProviders()
  const models = useModels()
  const error = providers.error ?? models.error

  // Kept in the URL so a view can be linked to and survives a reload
  const [params, setParams] = useSearchParams()
  const requested = params.get('view')
  const view: View = isView(requested) ? requested : 'providers'

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-line bg-raised px-5 py-3 text-[12px] text-bad"
      >
        Could not load providers and models: {error.message}
      </p>
    )
  }

  if (!providers.data || !models.data) {
    return <p className="text-[12px] text-muted">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <Tabs
        active={view}
        onChange={(id) => setParams({ view: id })}
        tabs={[
          {
            id: 'providers',
            label: 'Providers',
            count: providers.data.length,
          },
          { id: 'models', label: 'Models', count: models.data.length },
        ]}
      />

      <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
        {view === 'providers' ? (
          <ProvidersPanel providers={providers.data} />
        ) : (
          <ModelsPanel models={models.data} providers={providers.data} />
        )}
      </div>
    </div>
  )
}

function isView(value: string | null): value is View {
  return VIEWS.includes(value as View)
}
