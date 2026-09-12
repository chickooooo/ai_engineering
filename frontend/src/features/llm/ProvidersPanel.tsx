import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { Provider } from '../../api/providers'
import { Button } from '../../components/ui/Button'
import {
  ChoiceFilter,
  FilterBar,
  FilterCount,
  SearchFilter,
} from '../../components/ui/FilterBar'
import { StatusPill } from '../../components/ui/StatusPill'
import { EmptyRow, Table, Td, Th } from '../../components/ui/Table'
import { matchesSearch, matchesStatus, type StatusFilter } from './filters'
import { ProviderForm } from './ProviderForm'
import { useDeactivateProvider, useUpdateProvider } from './queries'

type Props = {
  providers: Provider[]
}

/** The provider list, with the filters and actions that change it. */
export function ProvidersPanel({ providers }: Props) {
  const [editing, setEditing] = useState<Provider | null>(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const update = useUpdateProvider()
  const deactivate = useDeactivateProvider()

  const shown = providers.filter(
    (provider) =>
      matchesSearch(provider.name, search) &&
      matchesStatus(provider.is_active, status),
  )

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-tight">
            Providers
          </h2>
          <p className="mt-0.5 text-[12px] text-muted">
            The companies whose models this app can call.
          </p>
        </div>

        <Button onClick={() => setAdding(true)}>
          <Plus className="size-3.5" aria-hidden="true" />
          New provider
        </Button>
      </header>

      <FilterBar>
        <SearchFilter
          label="Search providers"
          value={search}
          onChange={setSearch}
        />
        <ChoiceFilter
          label="Filter providers by status"
          value={status}
          onChange={(value) => setStatus(value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="retired">Retired</option>
        </ChoiceFilter>
        <FilterCount shown={shown.length} total={providers.length} />
      </FilterBar>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Added</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {shown.length === 0 ? (
            <EmptyRow colSpan={4}>
              {providers.length === 0
                ? 'No providers yet.'
                : 'No providers match these filters.'}
            </EmptyRow>
          ) : null}

          {shown.map((provider) => (
            <tr key={provider.id}>
              <Td className="font-medium">{provider.name}</Td>
              <Td>
                <StatusPill active={provider.is_active} />
              </Td>
              <Td className="font-mono text-muted">
                {new Date(provider.added_at).toLocaleDateString()}
              </Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(provider)}>
                    Edit
                  </Button>

                  {provider.is_active ? (
                    <Button
                      variant="danger"
                      aria-label={`Retire ${provider.name}`}
                      onClick={() => deactivate.mutate(provider.id)}
                    >
                      Retire
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      aria-label={`Restore ${provider.name}`}
                      onClick={() =>
                        update.mutate({
                          id: provider.id,
                          body: { is_active: true },
                        })
                      }
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {adding ? <ProviderForm onClose={() => setAdding(false)} /> : null}

      {editing ? (
        <ProviderForm provider={editing} onClose={() => setEditing(null)} />
      ) : null}
    </section>
  )
}
