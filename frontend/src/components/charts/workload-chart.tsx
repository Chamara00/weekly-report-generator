'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, ChartCard } from './chart-card';

/**
 * Hours spent per project.
 *
 * Horizontal bars: project names are long, and rotating labels on a vertical
 * chart makes them unreadable on a phone.
 */
export function WorkloadChart({
  data,
}: {
  data: { projectId: string; name: string; hours: number }[];
}) {
  return (
    <ChartCard
      title="Workload by project"
      description="Hours spent, counted once per report from its current version."
      isEmpty={data.every((project) => project.hours === 0)}
      emptyMessage="No hours recorded in this period."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 16, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" fontSize={11} />
          <YAxis type="category" dataKey="name" width={110} fontSize={11} />
          <Tooltip formatter={(value) => [`${String(value)}h`, 'Hours spent']} />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.projectId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
