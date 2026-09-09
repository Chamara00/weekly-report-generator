import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { StatCard } from '@/components/dashboard/stat-card';
import { QueueTable } from '@/components/manager/queue-table';
import { Pagination } from '@/components/shared/pagination';
import { getTeam, getTeamReports } from '@/lib/server-api';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Team member' };

// One member's profile: their stats plus their full report history.
export default async function TeamMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;

  let team;
  let reports;

  try {
    [team, reports] = await Promise.all([
      getTeam(),
      getTeamReports({ userId: id, page: Number(page ?? 1), limit: 10 }),
    ]);
  } catch (error) {
    return (
      <ErrorState
        title="Could not load this member"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }

  const member = team.members.find((candidate) => candidate.id === id);

  if (!member) notFound();

  const compliance =
    member.totalReports === 0
      ? 0
      : Math.round((member.byStatus.APPROVED / member.totalReports) * 100);

  return (
    <>
      <PageHeader
        title={member.name}
        description={member.email}
        actions={
          <Button variant="outline" render={<Link href="/manager/team" />}>
            Back to team
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total reports" value={member.totalReports} />
        <StatCard
          label="Approved"
          value={member.byStatus.APPROVED}
          hint={`${compliance}% of their reports`}
        />
        <StatCard label="Awaiting review" value={member.byStatus.SUBMITTED} />
        <StatCard
          label="This week"
          value={member.currentWeek.status ?? 'Not started'}
          hint={`week of ${formatDate(team.currentWeekStart)}`}
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Report history</h2>
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
}
