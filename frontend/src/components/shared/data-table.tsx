'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  /** Renders the cell. Given the whole row, so it can combine fields. */
  cell: (row: T) => ReactNode;
  /** Hidden below `sm` -- used to keep tables readable on a phone. */
  hideOnMobile?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Row identity; also the row's link target when `hrefFor` is given. */
  getRowId: (row: T) => string;
  /** Makes rows clickable. Kept as navigation rather than an onClick handler. */
  hrefFor?: (row: T) => string;
  emptyState?: ReactNode;
  /**
   * Rendered instead of the table below `sm`. A seven-column table cannot be
   * made readable on a phone by scrolling it sideways, so lists that need to
   * work on mobile pass a card renderer here.
   */
  mobileCard?: (row: T) => ReactNode;
}

/**
 * One generic table for every list in the app.
 *
 * Columns are passed in rather than hard-coded so the member's report history,
 * the manager's review queue and the team list all share this component and
 * therefore share row height, hover behaviour and mobile column-hiding.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  hrefFor,
  emptyState,
  mobileCard,
}: DataTableProps<T>) {
  const router = useRouter();

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {mobileCard ? (
        <div className="space-y-3 sm:hidden">
          {rows.map((row) => (
            <div
              key={getRowId(row)}
              onClick={hrefFor ? () => router.push(hrefFor(row)) : undefined}
              className={cn(
                'rounded-lg border p-4',
                hrefFor && 'hover:bg-muted/50 cursor-pointer',
              )}
            >
              {mobileCard(row)}
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          'overflow-x-auto rounded-lg border',
          mobileCard && 'hidden sm:block',
        )}
      >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.hideOnMobile && 'hidden sm:table-cell', column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={getRowId(row)}
              onClick={hrefFor ? () => router.push(hrefFor(row)) : undefined}
              className={cn(hrefFor && 'hover:bg-muted/50 cursor-pointer')}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(column.hideOnMobile && 'hidden sm:table-cell', column.className)}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
