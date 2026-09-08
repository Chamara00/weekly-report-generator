'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { humanise } from '@/lib/format';
import type { TaskType } from '@/lib/types';
import { CHART_COLORS, ChartCard } from './chart-card';

/** Team-wide split of hours across task types. */
export function TaskTypeChart({
  data,
}: {
  data: { taskType: TaskType; hours: number }[];
}) {
  // Zero slices are dropped from the pie itself (a 0% wedge is invisible but
  // still occupies a legend entry and a tooltip target).
  const rows = data
    .filter((entry) => entry.hours > 0)
    .map((entry) => ({ name: humanise(entry.taskType), value: entry.hours }));

  return (
    <ChartCard
      title="Time by task type"
      description="Where the team's hours went."
      isEmpty={rows.length === 0}
      emptyMessage="No hours broken down by type in this period."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={85}
            paddingAngle={2}
          >
            {rows.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${String(value)}h`, 'Hours']} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
