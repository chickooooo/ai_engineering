import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const BASE =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3' +
  ' text-[12px] font-medium transition-colors' +
  ' disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  ghost: 'border border-line text-muted hover:bg-raised hover:text-ink',
  danger: 'border border-line text-bad hover:bg-raised',
}

/** The one button in the app, in its three weights. */
export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
