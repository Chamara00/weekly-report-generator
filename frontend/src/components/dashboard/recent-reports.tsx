import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDateTime, formatWeek } from '@/lib/format';
import type { ReportListItem } from '@/lib/types';

// Recent activity on the member's own reports.
export function RecentReports({ reports }: { reports: ReportListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Your most recently updated reports.</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            description="Your reports will appear here once you create one."
          />
        ) : (
          <ul className="divide-y">
            {reports.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/reports/${report.id}`}
                  className="hover:bg-muted/50 -mx-2 flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatWeek(report.weekStartDate, report.weekEndDate)} ·{' '}
                      {report.project.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      v{report.currentVersion?.versionNumber ?? 1} · updated{' '}
                      {formatDateTime(report.updatedAt)}
                      {report._count.reviewComments > 0
                        ? ` · ${report._count.reviewComments} review comment${report._count.reviewComments === 1 ? '' : 's'}`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
