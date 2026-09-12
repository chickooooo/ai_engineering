/** The three states every status filter offers. */
export type StatusFilter = 'all' | 'active' | 'retired'

export function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.trim().toLowerCase())
}

export function matchesStatus(
  isActive: boolean,
  status: StatusFilter,
): boolean {
  if (status === 'all') {
    return true
  }

  return status === 'active' ? isActive : !isActive
}
