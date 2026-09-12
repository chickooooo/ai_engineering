type Tab = {
  id: string
  label: string
  count: number
}

type Props = {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

/** A tab strip where exactly one panel is open at a time. */
export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map((tab) => {
        const selected = tab.id === active

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`-mb-px flex items-center gap-2 border-b px-3 py-2.5 text-[13px] transition-colors ${
              selected
                ? 'border-primary font-medium text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                selected ? 'bg-raised text-ink' : 'bg-raised text-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
