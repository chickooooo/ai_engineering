import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../../api/health'

export const healthQueryKey = ['health'] as const

/**
 * Backend health, fetched only when the caller asks for it.
 *
 * Disabled by default so nothing is requested until `refetch` runs.
 */
export function useHealth() {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: getHealth,
    enabled: false,
    gcTime: 0,
  })
}
