import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
}

/** A small caption over a prominent value, the way a record panel reads. */
export function Field({ label, children }: Props) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium tracking-[0.12em] text-muted uppercase">
        {label}
      </p>
      <div className="mt-1.5 truncate text-[13px]">{children}</div>
    </div>
  )
}
