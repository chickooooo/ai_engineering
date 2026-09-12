import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createQueryClient } from './queryClient'

type Props = {
  children: ReactNode
  /** Pass a client to isolate state, as tests do. */
  client?: QueryClient
}

/** Everything the tree needs, in one place for the app and its tests. */
export function AppProviders({ children, client }: Props) {
  const queryClient = client ?? createQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
