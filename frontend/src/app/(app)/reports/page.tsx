import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportsTable } from '@/components/reports/reports-table';
import { getMyReports, getProjects } from '@/lib/server-api';
import type { ReportStatus } from '@/lib/types';

export const metadata = { title: 'My reports' };

type SearchParams = Record<string, string | undefined>;

// Reads filters from the URL and hands them straight to the API.
async function ReportsList({ params }: { params: SearchParams }) {
  const page = Number(params.page ?? 1);

  try {
    const [reports, projects] = await Promise.all([
      getMyReports({
        page,
        limit: 10,
        status: params.status as ReportStatus | undefined,
        projectId: params.projectId,
        weekStartFrom: params.weekStartFrom,
        weekStartTo: params.weekStartTo,
      }),
      getProjects(),
    ]);

    return (
      <>
        <ReportFilters projects={projects} />
        <div className="space-y-4">
          <ReportsTable reports={reports.data} />
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
        title="Could not load your reports"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeader
        title="My reports"
        description="Every weekly report you have filed."
        actions={
          <Button render={<Link href="/reports/new" />}>New report</Button>
        }
      />

      {/* Keyed on the filters so changing one remounts the boundary and shows the skeleton. */}
      <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={6} />}>
        <ReportsList params={params} />
      </Suspense>
    </>
  );
}
