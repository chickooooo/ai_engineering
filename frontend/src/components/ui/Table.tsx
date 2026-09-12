import type { ReactNode } from 'react'

/** A horizontally scrollable table that keeps the page from stretching. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        {children}
      </table>
    </div>
  )
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-line px-5 py-2.5 text-[10px] font-medium tracking-[0.12em] text-muted uppercase">
      {children}
    </th>
  )
}

export function Td({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <td className={`border-b border-line px-5 py-3 align-middle ${className}`}>
      {children}
    </td>
  )
}

/** Shown in place of rows when there is nothing yet. */
export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number
  children: ReactNode
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-8 text-center text-[12px] text-muted"
      >
        {children}
      </td>
    </tr>
  )
}
