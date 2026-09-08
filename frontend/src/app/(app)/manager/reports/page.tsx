import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { QueueFilters } from '@/components/manager/queue-filters';
import { QueueTable } from '@/components/manager/queue-table';
import { getProjects, getTeam, getTeamReports } from '@/lib/server-api';
import type { ReportStatus } from '@/lib/types';

export const metadata = { title: 'Review queue' };

type SearchParams = Record<string, string | undefined>;

async function Queue({ params }: { params: SearchParams }) {
  try {
    const [reports, team, projects] = await Promise.all([
      getTeamReports({
        page: Number(params.page ?? 1),
        limit: 10,
        userId: params.userId,
        projectId: params.projectId,
        status: params.status as ReportStatus | undefined,
        weekStartFrom: params.weekStartFrom,
        weekStartTo: params.weekStartTo,
      }),
      getTeam(),
      getProjects(),
    ]);

    return (
      <>
        <QueueFilters members={team.members} projects={projects} />
        <div className="space-y-4">
          <QueueTable reports={reports.data} />
          <Pagination
            page={reports.meta.page}
            totalPages={reports.meta.totalPages}
            total={reports.meta.total}
            limit={reports.meta.limit}
          />
        </div>
      </>
    );
  } catch (error) {
    return (
      <ErrorState
        title="Could not load the queue"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }
}

export default async function ManagerReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Every member's reports. Submitted ones come first — those are the ones waiting on you."
      />

      <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={8} columns={6} />}>
        <Queue params={params} />
      </Suspense>
    </>
  );
}
