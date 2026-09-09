'use client';

import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime, formatWeek } from '@/lib/format';
import type { ReportListItem } from '@/lib/types';

// The review queue table.
export function QueueTable({ reports }: { reports: ReportListItem[] }) {
  const columns: Column<ReportListItem>[] = [
    {
      key: 'member',
      header: 'Team member',
      cell: (report) => <span className="font-medium">{report.user.name}</span>,
    },
    {
      key: 'week',
      header: 'Week',
      cell: (report) => formatWeek(report.weekStartDate, report.weekEndDate),
    },
    { key: 'project', header: 'Project', cell: (report) => report.project.name },
    {
      key: 'status',
      header: 'Status',
      cell: (report) => <StatusBadge status={report.status} />,
    },
    {
      key: 'versions',
      header: 'Ver.',
      hideOnMobile: true,
      cell: (report) => <span className="tabular-nums">{report._count.versions}</span>,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      hideOnMobile: true,
      cell: (report) => (
        <span className="text-muted-foreground text-sm">
          {formatDateTime(report.currentVersion?.submittedAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={reports}
      getRowId={(report) => report.id}
      hrefFor={(report) => `/manager/reports/${report.id}`}
      mobileCard={(report) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{report.user.name}</span>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm">
            {formatWeek(report.weekStartDate, report.weekEndDate)} · {report.project.name}
          </p>
          <p className="text-muted-foreground text-xs">
            v{report._count.versions} · submitted{' '}
            {formatDateTime(report.currentVersion?.submittedAt)}
          </p>
        </div>
      )}
      emptyState={
        <EmptyState
          title="Nothing in the queue"
          description="No reports match these filters."
        />
      }
    />
  );
}
