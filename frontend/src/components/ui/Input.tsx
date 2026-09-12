import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

/** A labelled field, wired so the label actually selects the input. */
export function Input({ label, id, className = '', ...rest }: Props) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="text-[10px] font-medium tracking-[0.12em] text-muted uppercase"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`mt-1.5 h-8 w-full rounded-md border border-line bg-surface px-2.5 text-[13px] text-ink outline-none focus:border-primary ${className}`}
        {...rest}
      />
    </div>
  )
}
