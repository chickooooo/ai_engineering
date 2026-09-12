type Props = {
  active: boolean
}

/** Whether a row is live or retired, at a glance. */
export function StatusPill({ active }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]">
      <span
        className={`size-1.5 rounded-full ${active ? 'bg-ok' : 'bg-muted'}`}
        aria-hidden="true"
      />
      {active ? 'Active' : 'Retired'}
    </span>
  )
}
