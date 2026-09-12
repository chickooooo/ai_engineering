import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

type Props = {
  title: string
  children: ReactNode
}

/** Sidebar, page header and content area — the frame every screen sits in. */
export function AppShell({ title, children }: Props) {
  return (
    <div className="flex h-full">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-6">
          <h1 className="text-[15px] font-medium tracking-tight">{title}</h1>
          <span className="font-mono text-[11px] text-muted">
            {import.meta.env.VITE_API_BASE_URL || 'localhost:8080'}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
