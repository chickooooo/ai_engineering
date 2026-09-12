import { screen, within } from '@testing-library/react'

/** The table row a cell's text sits in, scoped for further queries. */
export function rowFor(text: string): ReturnType<typeof within> {
  const row = screen.getByText(text).closest('tr')

  if (row === null) {
    throw new Error(`"${text}" is not in a table row`)
  }

  return within(row)
}
