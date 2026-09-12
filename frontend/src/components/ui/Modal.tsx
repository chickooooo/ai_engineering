import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

/** A centred dialog for the create and edit forms. */
export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md overflow-hidden rounded-lg border border-line bg-panel"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
