import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { LLMModel } from '../../api/models'
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
import { ModelForm } from './ModelForm'
import { useDeactivateModel, useUpdateModel } from './queries'

type Props = {
  models: LLMModel[]
  providers: Provider[]
}

/** Why the table is empty: nothing added, or nothing matching. */
function emptyMessage(providers: Provider[], models: LLMModel[]): string {
  if (providers.length === 0) {
    return 'Add a provider first.'
  }

  return models.length === 0
    ? 'No models yet.'
    : 'No models match these filters.'
}

/** Trims the trailing zeros a decimal string carries from the database. */
function price(value: string): string {
  return String(Number(value))
}

/** The model list, with the filters and actions that change it. */
export function ModelsPanel({ models, providers }: Props) {
  const [editing, setEditing] = useState<LLMModel | null>(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [provider, setProvider] = useState('all')
  const update = useUpdateModel()
  const deactivate = useDeactivateModel()

  const providerName = new Map(providers.map((one) => [one.id, one.name]))

  const shown = models.filter(
    (model) =>
      matchesSearch(model.name, search) &&
      matchesStatus(model.is_active, status) &&
      (provider === 'all' || String(model.provider_id) === provider),
  )

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-tight">Models</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Prices are USD per million tokens.
          </p>
        </div>

        <Button
          onClick={() => setAdding(true)}
          disabled={providers.length === 0}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New model
        </Button>
      </header>

      <FilterBar>
        <SearchFilter
          label="Search models"
          value={search}
          onChange={setSearch}
        />
        <ChoiceFilter
          label="Filter models by provider"
          value={provider}
          onChange={setProvider}
        >
          <option value="all">All providers</option>
          {providers.map((one) => (
            <option key={one.id} value={one.id}>
              {one.name}
            </option>
          ))}
        </ChoiceFilter>
        <ChoiceFilter
          label="Filter models by status"
          value={status}
          onChange={(value) => setStatus(value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="retired">Retired</option>
        </ChoiceFilter>
        <FilterCount shown={shown.length} total={models.length} />
      </FilterBar>

      <Table>
        <thead>
          <tr>
            <Th>Model</Th>
            <Th>Provider</Th>
            <Th>Input</Th>
            <Th>Cached</Th>
            <Th>Cache write</Th>
            <Th>Output</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {shown.length === 0 ? (
            <EmptyRow colSpan={8}>{emptyMessage(providers, models)}</EmptyRow>
          ) : null}

          {shown.map((model) => (
            <tr key={model.id}>
              <Td className="font-medium">{model.name}</Td>
              <Td className="text-muted">
                {providerName.get(model.provider_id) ?? '—'}
              </Td>
              <Td className="font-mono text-muted">
                {price(model.input_price)}
              </Td>
              <Td className="font-mono text-muted">
                {price(model.cached_input_price)}
              </Td>
              <Td className="font-mono text-muted">
                {price(model.cache_write_price)}
              </Td>
              <Td className="font-mono text-muted">
                {price(model.output_price)}
              </Td>
              <Td>
                <StatusPill active={model.is_active} />
              </Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(model)}>
                    Edit
                  </Button>

                  {model.is_active ? (
                    <Button
                      variant="danger"
                      aria-label={`Retire ${model.name}`}
                      onClick={() => deactivate.mutate(model.id)}
                    >
                      Retire
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      aria-label={`Restore ${model.name}`}
                      onClick={() =>
                        update.mutate({
                          id: model.id,
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

      {adding ? (
        <ModelForm providers={providers} onClose={() => setAdding(false)} />
      ) : null}

      {editing ? (
        <ModelForm
          providers={providers}
          model={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  )
}
