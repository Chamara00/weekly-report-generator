'use client';

import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import type { TrendPoint } from '@/lib/types';
import { CHART_COLORS, ChartCard } from './chart-card';

/**
 * Completed tasks per week.
 *
 * Two modes: one line for the team total, or one line per member. The API
 * returns both shapes in a single response, so toggling is local state with no
 * extra request.
 */
export function TasksTrendChart({ trend }: { trend: TrendPoint[] }) {
  const [perMember, setPerMember] = useState(false);

  // Every member who appears in any week, so a member missing from one week
  // still gets a line (rendered as a gap rather than vanishing).
  const members = Array.from(
    new Map(
      trend.flatMap((point) => point.byMember.map((m) => [m.userId, m.name] as const)),
    ).entries(),
  ).map(([userId, name]) => ({ userId, name }));

  const data = trend.map((point) => {
    const row: Record<string, string | number> = {
      week: formatDate(point.weekStart),
      Team: point.total,
    };

    for (const member of members) {
      row[member.name] =
        point.byMember.find((m) => m.userId === member.userId)?.completed ?? 0;
    }

    return row;
  });

  const isEmpty = trend.every((point) => point.total === 0);

  return (
    <ChartCard
      title="Tasks completed"
      description="Completed tasks per week, from each report's current version."
      isEmpty={isEmpty}
      emptyMessage="No completed tasks in this period."
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPerMember((current) => !current)}
        >
          {perMember ? 'Show team total' : 'Show per member'}
        </Button>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="week" fontSize={11} tickMargin={8} />
          <YAxis fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {perMember ? (
            members.map((member, index) => (
              <Line
                key={member.userId}
                type="monotone"
                dataKey={member.name}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey="Team"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
