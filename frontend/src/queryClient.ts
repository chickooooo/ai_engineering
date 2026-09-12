import { QueryClient } from '@tanstack/react-query'

/** Build a query client with the defaults every caller should share. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })
}
