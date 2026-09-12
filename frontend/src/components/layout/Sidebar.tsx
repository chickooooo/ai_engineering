import { Home, Sparkles, type LucideIcon } from 'lucide-react'

type NavItem = {
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [{ label: 'Home', icon: Home }]

/** The app's primary navigation, pinned to the left of every screen. */
export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-surface">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          AI Engineering
        </span>
      </div>

      <nav aria-label="Main" className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <li key={label}>
              <a
                href="#"
                aria-current="page"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-ink aria-[current=page]:bg-raised aria-[current=page]:text-primary"
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line px-5 py-4 text-xs text-muted">
        v0.1.0
      </div>
    </aside>
  )
}
