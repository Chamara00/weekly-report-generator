import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Shared frame for every chart: title, optional description.
export function ChartCard({
  title,
  description,
  isEmpty,
  emptyMessage = 'No data for this period.',
  action,
  children,
}: {
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="text-muted-foreground flex h-[260px] items-center justify-center rounded-md border border-dashed text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="h-[260px] w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Palette shared by every chart so a member keeps one colour across views.
export const CHART_COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
];

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#2563eb',
  NEEDS_CORRECTION: '#d97706',
  APPROVED: '#16a34a',
};
