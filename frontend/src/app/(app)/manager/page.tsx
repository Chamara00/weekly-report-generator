import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { CardsSkeleton } from '@/components/shared/loading-skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActivityFeed } from '@/components/manager/activity-feed';
import { WeekSelector } from '@/components/manager/week-selector';
import { StatusByMemberChart } from '@/components/charts/status-by-member-chart';
import { TaskTypeChart } from '@/components/charts/task-type-chart';
import { TasksTrendChart } from '@/components/charts/tasks-trend-chart';
import { WorkloadChart } from '@/components/charts/workload-chart';
import {
  getActivity,
  getDashboardCharts,
  getDashboardSummary,
} from '@/lib/server-api';
import { mondayOf } from '@/lib/format';

export const metadata = { title: 'Team overview' };

// All four panels for one week, fetched in parallel on the server.
async function DashboardContent({ weekStart }: { weekStart: string }) {
  try {
    const [summary, charts, activity] = await Promise.all([
      getDashboardSummary(weekStart),
      getDashboardCharts({ weekStart, weeks: 6 }),
      getActivity(10),
    ]);

    const { compliance } = summary;
    const complianceRate =
      compliance.expected === 0
        ? 0
        : Math.round((compliance.submitted / compliance.expected) * 100);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Submitted this week"
            value={summary.reportsSubmittedThisWeek}
            hint={`of ${compliance.expected} expected`}
          />
          <StatCard
            label="Compliance"
            value={`${complianceRate}%`}
            hint={`${compliance.notStarted} not started · ${compliance.late} late`}
          />
          <StatCard
            label="Needs correction"
            value={summary.needsCorrectionCount}
            hint="team-wide, all weeks"
          />
          <StatCard
            label="Open blockers"
            value={summary.openBlockersCount}
            hint="on current versions, not yet approved"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TasksTrendChart trend={charts.tasksCompletedTrend} />
          <StatusByMemberChart data={charts.statusByMember} />
          <WorkloadChart data={charts.workloadByProject} />
          <TaskTypeChart data={charts.timeByTaskType} />
        </div>

        <ActivityFeed items={activity.data} />
      </div>
    );
  } catch (error) {
    return (
      <ErrorState
        title="Could not load the dashboard"
        message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
      />
    );
  }
}

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>;
}) {
  const { weekStart } = await searchParams;
  const week = weekStart ?? mondayOf();

  return (
    <>
      <PageHeader
        title="Team overview"
        description="Reporting health across the team, for the selected week."
      />

      <WeekSelector weekStart={week} />

      {/* Keyed on the week so switching weeks shows skeletons rather than holding the previous week's. */}
      <Suspense key={week} fallback={<CardsSkeleton />}>
        <DashboardContent weekStart={week} />
      </Suspense>
    </>
  );
}
