import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { CorrectionCallout } from '@/components/dashboard/correction-callout';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { StatCard } from '@/components/dashboard/stat-card';
import { ThisWeekCard } from '@/components/dashboard/this-week-card';
import { getCurrentUser, getMyReports } from '@/lib/server-api';
import { mondayOf, weekEndFor } from '@/lib/format';
import type { ReportListItem } from '@/lib/types';

export const metadata = { title: 'My dashboard' };

// The member's landing page.
export default async function DashboardPage() {
  const weekStart = mondayOf();
  const weekEnd = weekEndFor(weekStart);

  let user;
  let reports: ReportListItem[];
  let needsCorrection: ReportListItem[];

  try {
    // Two focused queries rather than one big one.
    const [me, recent, corrections] = await Promise.all([
      getCurrentUser(),
      getMyReports({ limit: 50 }),
      getMyReports({ status: 'NEEDS_CORRECTION', limit: 20 }),
    ]);
    user = me;
    reports = recent.data;
    needsCorrection = corrections.data;
  } catch (error) {
    return (
      <ErrorState
        title="Could not load your dashboard"
        message={
          error instanceof Error
            ? error.message
            : 'Something went wrong loading your dashboard. Please try again.'
        }
      />
    );
  }

  const thisWeek = reports.find((report) => report.weekStartDate.slice(0, 10) === weekStart);
  const approved = reports.filter((report) => report.status === 'APPROVED').length;
  const awaitingReview = reports.filter((report) => report.status === 'SUBMITTED').length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="Your weekly reporting at a glance."
        actions={
          <Button render={<Link href="/reports/new" />}>New report</Button>
        }
      />

      <div className="space-y-6">
        <CorrectionCallout reports={needsCorrection} />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ThisWeekCard report={thisWeek ?? null} weekStart={weekStart} weekEnd={weekEnd} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard label="Total reports" value={reports.length} />
            <StatCard
              label="Approved"
              value={approved}
              hint={awaitingReview > 0 ? `${awaitingReview} awaiting review` : undefined}
            />
          </div>
        </div>

        <RecentReports reports={reports.slice(0, 6)} />
      </div>
    </>
  );
}
