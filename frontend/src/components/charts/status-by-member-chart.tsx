'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { humanise } from '@/lib/format';
import { REPORT_STATUSES, type StatusByMember } from '@/lib/types';
import { ChartCard, STATUS_COLORS } from './chart-card';

// Stacked bar of report statuses per member.
export function StatusByMemberChart({ data }: { data: StatusByMember[] }) {
  const rows = data.map((member) => ({
    // First name only: full names overlap badly on a narrow axis.
    name: member.name.split(' ')[0],
    ...member.byStatus,
  }));

  return (
    <ChartCard
      title="Reports by status"
      description="Per member, across the selected period."
      isEmpty={data.every((member) => member.total === 0)}
      emptyMessage="No reports in this period."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" fontSize={11} tickMargin={8} />
          <YAxis fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {REPORT_STATUSES.map((status) => (
            <Bar
              key={status}
              dataKey={status}
              name={humanise(status)}
              stackId="reports"
              fill={STATUS_COLORS[status]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
