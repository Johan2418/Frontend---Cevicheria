import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface Column<T> {
  /** Stable key, also used as the React key for cells. */
  key: string;
  header: ReactNode;
  /** Renders the cell for one row. */
  cell: (row: T) => ReactNode;
  /** Right-align numeric columns so digits line up. */
  align?: 'left' | 'right';
  /** Hide on narrow screens when the column is secondary. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered in place of the table body when there are no rows. */
  empty?: ReactNode;
  caption?: string;
}

const hideClasses = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const;

/**
 * Wraps its own horizontal scroll container so a wide table never forces the
 * page to scroll sideways. Replaces the raw <table> markup that was repeated
 * across the staff pages.
 */
export function Table<T>({ columns, rows, rowKey, empty, caption }: TableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-stone-200 text-stone-500">
            {columns.map((col, i) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'py-2 font-medium',
                  i < columns.length - 1 && 'pr-4',
                  col.align === 'right' && 'text-right',
                  col.hideBelow && hideClasses[col.hideBelow],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  className={cn(
                    'py-2.5',
                    i < columns.length - 1 && 'pr-4',
                    col.align === 'right' && 'text-right tabular-nums',
                    col.hideBelow && hideClasses[col.hideBelow],
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
