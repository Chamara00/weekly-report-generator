'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime, formatWeek } from '@/lib/format';
import type { ReportListItem } from '@/lib/types';

/**
 * Column definitions for the member's report history.
 *
 * A thin client wrapper around the shared DataTable: the columns need render
 * functions, which cannot cross the server/client boundary as props.
 */
export function ReportsTable({ reports }: { reports: ReportListItem[] }) {
  const columns: Column<ReportListItem>[] = [
    {
      key: 'week',
      header: 'Week',
      cell: (report) => (
        <span className="font-medium">
          {formatWeek(report.weekStartDate, report.weekEndDate)}
        </span>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      cell: (report) => report.project.name,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (report) => <StatusBadge status={report.status} />,
    },
    {
      key: 'versions',
      header: 'Versions',
      hideOnMobile: true,
      cell: (report) => (
        <span className="tabular-nums">
          {report._count.versions}
          {report._count.versions > 1 ? (
            <span className="text-muted-foreground text-xs"> (revised)</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Last updated',
      hideOnMobile: true,
      cell: (report) => (
        <span className="text-muted-foreground text-sm">
          {formatDateTime(report.updatedAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={reports}
      getRowId={(report) => report.id}
      hrefFor={(report) => `/reports/${report.id}`}
      emptyState={
        <EmptyState
          title="No reports found"
          description="Nothing matches these filters. Clear them, or create a report for this week."
          action={
            <Button render={<Link href="/reports/new" />}>New report</Button>
          }
        />
      }
    />
  );
}
