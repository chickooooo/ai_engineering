import { Boxes, House, PanelLeft, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: House },
  { label: 'Manage Models', to: '/models', icon: Boxes },
]

/** The app's primary navigation, pinned to the left of every screen. */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-150 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-line ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {collapsed ? null : (
          <span className="truncate text-[13px] font-semibold tracking-tight">
            AI Engineering
          </span>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((open) => !open)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          <PanelLeft className="size-4" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-4">
        {collapsed ? null : (
          <p className="px-2 pb-2 text-[10px] font-medium tracking-[0.12em] text-muted uppercase">
            Workspace
          </p>
        )}

        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <li key={label}>
              <NavLink
                to={to}
                end
                aria-label={label}
                title={collapsed ? label : undefined}
                className={`group relative flex h-8 items-center rounded-md text-[13px] text-muted transition-colors hover:bg-raised hover:text-ink aria-[current=page]:bg-raised aria-[current=page]:font-medium aria-[current=page]:text-ink ${
                  collapsed ? 'justify-center px-0' : 'gap-2.5 px-2'
                }`}
              >
                <span
                  className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary opacity-0 group-aria-[current=page]:opacity-100"
                  aria-hidden="true"
                />
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {collapsed ? null : label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {collapsed ? null : (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[11px] text-muted">
          <span>Version</span>
          <span className="font-mono">0.1.0</span>
        </div>
      )}
    </aside>
  )
}
