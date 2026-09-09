import Link from 'next/link';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { CardsSkeleton } from '@/components/shared/loading-skeleton';
import { SectionPicker } from '@/components/manager/section-picker';
import { WeekSelector } from '@/components/manager/week-selector';
import { getSectionView } from '@/lib/server-api';
import { mondayOf } from '@/lib/format';

export const metadata = { title: 'Team week' };

// One week, one section, every member side by side.
async function SectionGrid({ week, section }: { week: string; section: string }) {
  let view;

  try {
    view = await getSectionView({ weekStart: week, section });
  } catch (error) {
    return (
      <ErrorState
        title="Could not load this week"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }

  const isBlockers = view.section === 'BLOCKERS';
  const keyLabel = isBlockers ? 'Key issue' : 'Key achievement';

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {view.members.map((member) => (
        <Card key={member.userId} className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span>{member.name}</span>
              {member.status ? (
                <StatusBadge status={member.status} />
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-dashed">
                  Not started
                </Badge>
              )}
            </CardTitle>
            {member.project ? (
              <p className="text-muted-foreground text-xs">
                {member.project.name} · v{member.versionNumber}
                {member.reportId ? (
                  <>
                    {' · '}
                    <Link
                      href={`/manager/reports/${member.reportId}`}
                      className="underline underline-offset-4"
                    >
                      open report
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            {member.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {member.status
                  ? `No ${isBlockers ? 'blockers' : 'achievements'} recorded.`
                  : 'No report for this week.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {member.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="flex-1">{item.description}</span>
                    {item.isKey ? (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {keyLabel}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function TeamWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string; section?: string }>;
}) {
  const params = await searchParams;
  const week = params.weekStart ?? mondayOf();
  const section = params.section === 'ACHIEVEMENTS' ? 'ACHIEVEMENTS' : 'BLOCKERS';

  return (
    <>
      <PageHeader
        title="Team week"
        description="One section of everyone's report for a single week, side by side."
      />

      <WeekSelector weekStart={week} />

      <div className="mb-6">
        <SectionPicker section={section} />
      </div>

      <Suspense key={`${week}-${section}`} fallback={<CardsSkeleton count={6} />}>
        <SectionGrid week={week} section={section} />
      </Suspense>
    </>
  );
}
