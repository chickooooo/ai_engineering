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
        <header className="flex h-16 shrink-0 items-center border-b border-line px-8">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
