import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { StatCard } from '@/components/dashboard/stat-card';
import { TeamTable } from '@/components/manager/team-table';
import { getTeam } from '@/lib/server-api';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Team members' };

export default async function TeamPage() {
  let team;

  try {
    team = await getTeam();
  } catch (error) {
    return (
      <ErrorState
        title="Could not load the team"
        message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
      />
    );
  }

  const submitted = team.members.filter((member) => member.currentWeek.hasSubmitted).length;
  const notStarted = team.members.filter((member) => !member.currentWeek.status).length;
  const needsCorrection = team.members.reduce(
    (sum, member) => sum + member.byStatus.NEEDS_CORRECTION,
    0,
  );

  return (
    <>
      <PageHeader
        title="Team members"
        description={`Reporting status for the week of ${formatDate(team.currentWeekStart)}.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Submitted this week"
          value={`${submitted} / ${team.members.length}`}
        />
        <StatCard label="Not started" value={notStarted} />
        <StatCard label="Awaiting corrections" value={needsCorrection} />
      </div>

      <TeamTable members={team.members} />
    </>
  );
}
