import { useState, type FormEvent } from 'react'
import type { Provider } from '../../api/providers'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useCreateProvider, useUpdateProvider } from './queries'

type Props = {
  provider?: Provider
  onClose: () => void
}

/** Add a provider, or rename the one passed in. */
export function ProviderForm({ provider, onClose }: Props) {
  const [name, setName] = useState(provider?.name ?? '')
  const create = useCreateProvider()
  const update = useUpdateProvider()
  const pending = create.isPending || update.isPending
  const error = create.error ?? update.error

  // `mutate` rather than `mutateAsync`: the error belongs in the hook's
  // state, which the alert below reads, not in a rejected promise
  function onSubmit(event: FormEvent) {
    event.preventDefault()

    if (provider) {
      update.mutate({ id: provider.id, body: { name } }, { onSuccess: onClose })
    } else {
      create.mutate({ name }, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      title={provider ? 'Edit provider' : 'New provider'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="ANTHROPIC"
          required
          autoFocus
        />

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
