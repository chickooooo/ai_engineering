import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

const CONTROL =
  'h-7 rounded-md border border-line bg-surface px-2 text-[12px]' +
  ' text-ink outline-none focus:border-primary'

type SearchProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

/** The row of controls that narrows a table. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-2.5">
      {children}
    </div>
  )
}

export function SearchFilter({ label, value, onChange }: SearchProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        aria-label={label}
        placeholder="Search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} w-48 pr-2 pl-7`}
      />
    </div>
  )
}

type ChoiceProps = {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

export function ChoiceFilter({
  label,
  value,
  onChange,
  children,
}: ChoiceProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={CONTROL}
    >
      {children}
    </select>
  )
}

/** How many rows survived the filters, when some did not. */
export function FilterCount({
  shown,
  total,
}: {
  shown: number
  total: number
}) {
  if (shown === total) {
    return null
  }

  return (
    <span className="ml-auto text-[11px] text-muted">
      {shown} of {total}
    </span>
  )
}
