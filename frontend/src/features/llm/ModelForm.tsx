import { useState, type FormEvent } from 'react'
import type { LLMModel } from '../../api/models'
import type { Provider } from '../../api/providers'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { useCreateModel, useUpdateModel } from './queries'

type Props = {
  providers: Provider[]
  model?: LLMModel
  onClose: () => void
}

const PRICE_FIELDS = [
  { key: 'input_price', label: 'Input price' },
  { key: 'cached_input_price', label: 'Cached input price' },
  { key: 'cache_write_price', label: 'Cache write price' },
  { key: 'output_price', label: 'Output price' },
] as const

type Prices = Record<(typeof PRICE_FIELDS)[number]['key'], string>

const ZERO_PRICES: Prices = {
  input_price: '0',
  cached_input_price: '0',
  cache_write_price: '0',
  output_price: '0',
}

/** Add a model, or edit the one passed in. */
export function ModelForm({ providers, model, onClose }: Props) {
  const [providerId, setProviderId] = useState(
    String(model?.provider_id ?? providers[0]?.id ?? ''),
  )
  const [name, setName] = useState(model?.name ?? '')
  const [prices, setPrices] = useState<Prices>(() =>
    model
      ? {
          input_price: model.input_price,
          cached_input_price: model.cached_input_price,
          cache_write_price: model.cache_write_price,
          output_price: model.output_price,
        }
      : ZERO_PRICES,
  )

  const create = useCreateModel()
  const update = useUpdateModel()
  const pending = create.isPending || update.isPending
  const error = create.error ?? update.error

  // `mutate` rather than `mutateAsync`: the error belongs in the hook's
  // state, which the alert below reads, not in a rejected promise
  function onSubmit(event: FormEvent) {
    event.preventDefault()

    if (model) {
      update.mutate(
        { id: model.id, body: { name, ...prices } },
        { onSuccess: onClose },
      )
    } else {
      create.mutate(
        { provider_id: Number(providerId), name, ...prices },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal title={model ? 'Edit model' : 'New model'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        {model ? null : (
          <Select
            label="Provider"
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
            required
          >
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="claude-haiku-4-5"
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          {PRICE_FIELDS.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              type="number"
              min="0"
              step="0.000001"
              value={prices[key]}
              onChange={(event) =>
                setPrices((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              required
            />
          ))}
        </div>

        <p className="text-[11px] text-muted">
          Prices are USD per million tokens.
        </p>

        {error ? (
          <p role="alert" className="text-[12px] text-bad">
            {error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
