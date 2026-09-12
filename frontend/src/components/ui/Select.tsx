import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
}

/** A labelled select, wired so the label actually selects the control. */
export function Select({
  label,
  id,
  className = '',
  children,
  ...rest
}: Props) {
  const selectId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="min-w-0">
      <label
        htmlFor={selectId}
        className="text-[10px] font-medium tracking-[0.12em] text-muted uppercase"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`mt-1.5 h-8 w-full rounded-md border border-line bg-surface px-2 text-[13px] text-ink outline-none focus:border-primary ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}
