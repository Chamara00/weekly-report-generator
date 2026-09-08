'use client';

import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import type { TeamMemberStats } from '@/lib/types';

/** "Has this week's report arrived?" as a single glanceable cell. */
function ThisWeekCell({ member }: { member: TeamMemberStats }) {
  if (member.currentWeek.status) {
    return <StatusBadge status={member.currentWeek.status} />;
  }

  return (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      Not started
    </Badge>
  );
}

export function TeamTable({ members }: { members: TeamMemberStats[] }) {
  const columns: Column<TeamMemberStats>[] = [
    {
      key: 'name',
      header: 'Team member',
      cell: (member) => (
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-muted-foreground text-xs">{member.email}</p>
        </div>
      ),
    },
    {
      key: 'thisWeek',
      header: 'This week',
      cell: (member) => <ThisWeekCell member={member} />,
    },
    {
      key: 'total',
      header: 'Reports',
      hideOnMobile: true,
      cell: (member) => <span className="tabular-nums">{member.totalReports}</span>,
    },
    {
      key: 'approved',
      header: 'Approved',
      hideOnMobile: true,
      cell: (member) => (
        <span className="tabular-nums">{member.byStatus.APPROVED}</span>
      ),
    },
    {
      key: 'awaiting',
      header: 'Awaiting review',
      hideOnMobile: true,
      cell: (member) => (
        <span className="tabular-nums">{member.byStatus.SUBMITTED}</span>
      ),
    },
    {
      key: 'correction',
      header: 'Needs correction',
      hideOnMobile: true,
      cell: (member) => (
        <span
          className={
            member.byStatus.NEEDS_CORRECTION > 0
              ? 'font-medium tabular-nums text-amber-600 dark:text-amber-400'
              : 'tabular-nums'
          }
        >
          {member.byStatus.NEEDS_CORRECTION}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={members}
      getRowId={(member) => member.id}
      hrefFor={(member) => `/manager/team/${member.id}`}
      mobileCard={(member) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{member.name}</span>
            <ThisWeekCell member={member} />
          </div>
          <p className="text-muted-foreground text-xs">
            {member.totalReports} reports · {member.byStatus.APPROVED} approved ·{' '}
            {member.byStatus.SUBMITTED} awaiting · {member.byStatus.NEEDS_CORRECTION} to fix
          </p>
        </div>
      )}
      emptyState={<EmptyState title="No team members yet" />}
    />
  );
}
