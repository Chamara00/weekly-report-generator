import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDateTime } from '@/lib/format';
import type { ActivityItem } from '@/lib/types';

const DOT: Record<ActivityItem['type'], string> = {
  SUBMITTED: 'bg-blue-500',
  APPROVE: 'bg-emerald-500',
  REQUEST_CHANGES: 'bg-amber-500',
};

// Recent submissions and review decisions.
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Submissions and review decisions, newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={`${item.reportId}-${item.at}-${index}`} className="flex gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[item.type]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.actorName}</span> {item.label}{' '}
                    <Link
                      href={`/manager/reports/${item.reportId}`}
                      className="underline underline-offset-4"
                    >
                      {item.ownerName === item.actorName
                        ? `their ${item.projectName} report`
                        : `${item.ownerName}'s ${item.projectName} report`}
                    </Link>{' '}
                    <span className="text-muted-foreground">(v{item.versionNumber})</span>
                  </p>
                  <p className="text-muted-foreground text-xs">{formatDateTime(item.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
