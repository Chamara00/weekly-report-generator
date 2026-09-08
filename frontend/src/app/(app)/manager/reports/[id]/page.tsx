import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { ReportContent } from '@/components/reports/report-content';
import { ReviewTrail } from '@/components/reports/review-trail';
import { VersionHistory } from '@/components/reports/version-history';
import { ReviewPanel } from '@/components/manager/review-panel';
import { ApiError, getReportVersion, getTeamReport } from '@/lib/server-api';
import { formatWeek } from '@/lib/format';

export const metadata = { title: 'Review report' };

/**
 * The manager's read-and-decide view.
 *
 * Content is rendered by the same read-only ReportContent the member sees, so
 * there is literally no editing affordance on this page -- the only writes
 * available are the two buttons in ReviewPanel.
 */
export default async function ReviewReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version: requestedVersionId } = await searchParams;

  let report;

  try {
    report = await getTeamReport(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <ErrorState
        title="Could not load this report"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }

  let shownVersion = report.currentVersion;
  let isViewingPast = false;

  if (requestedVersionId && requestedVersionId !== report.currentVersionId) {
    try {
      shownVersion = await getReportVersion(id, requestedVersionId);
      isViewingPast = true;
    } catch {
      shownVersion = report.currentVersion;
    }
  }

  return (
    <>
      <PageHeader
        title={`${report.user.name} · ${formatWeek(report.weekStartDate, report.weekEndDate)}`}
        description={report.project.name}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={report.status} />
            <Button variant="outline" render={<Link href="/manager/reports" />}>
              Back to queue
            </Button>
          </div>
        }
      />

      {isViewingPast && shownVersion ? (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
          <span className="font-medium">Viewing version {shownVersion.versionNumber}</span> — a
          frozen earlier submission. Review actions always apply to the current version.{' '}
          <Link href={`/manager/reports/${report.id}`} className="underline underline-offset-4">
            Back to the current version
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {shownVersion ? (
            <ReportContent version={shownVersion} />
          ) : (
            <ErrorState message="This report has no content." />
          )}
        </div>

        <aside className="space-y-6">
          <ReviewPanel report={report} />
          <VersionHistory
            reportId={report.id}
            versions={report.versions}
            currentVersionId={report.currentVersionId}
            selectedVersionId={shownVersion?.id ?? ''}
            basePath="/manager/reports"
          />
          <ReviewTrail comments={report.reviewComments} />
        </aside>
      </div>
    </>
  );
}
