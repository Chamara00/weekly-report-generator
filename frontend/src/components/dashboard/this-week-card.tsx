import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, formatDateTime } from '@/lib/format';
import type { ReportListItem } from '@/lib/types';

/**
 * "Where does this week stand?" -- the first thing a member should see.
 *
 * Four distinct states: nothing started, a draft in progress, submitted and
 * waiting, or approved. Each gets its own call to action.
 */
export function ThisWeekCard({
  report,
  weekStart,
  weekEnd,
}: {
  report: ReportListItem | null;
  weekStart: string;
  weekEnd: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>This week</span>
          {report ? <StatusBadge status={report.status} /> : null}
        </CardTitle>
        <CardDescription>
          {formatDate(weekStart)} – {formatDate(weekEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!report ? (
          <>
            <p className="text-muted-foreground text-sm">
              You have not started this week&apos;s report yet.
            </p>
            <Button render={<Link href={`/reports/new?weekStart=${weekStart}`} />}>Start this week&apos;s report</Button>
          </>
        ) : (
          <>
            <div className="text-sm">
              <p className="font-medium">{report.project.name}</p>
              <p className="text-muted-foreground">
                Version {report.currentVersion?.versionNumber ?? 1} ·{' '}
                {report.currentVersion?.submittedAt
                  ? `submitted ${formatDateTime(report.currentVersion.submittedAt)}`
                  : 'not submitted yet'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" render={<Link href={`/reports/${report.id}`} />}>View report</Button>
              {report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION' ? (
                <Button render={<Link href={`/reports/${report.id}/edit`} />}>{report.status === 'DRAFT' ? 'Continue editing' : 'Make corrections'}</Button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
