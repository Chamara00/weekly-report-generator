import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { ReportContent } from '@/components/reports/report-content';
import { ReviewTrail } from '@/components/reports/review-trail';
import { VersionHistory } from '@/components/reports/version-history';
import { ApiError, getCurrentUser, getReport, getReportVersion } from '@/lib/server-api';
import { formatWeek } from '@/lib/format';

export const metadata = { title: 'Report' };

/**
 * Read-only report detail, used by members and managers alike.
 *
 * ?version=<id> switches the content panel to a past version, fetched through
 * the dedicated versions endpoint. The review trail and history list always
 * show the whole story regardless of which version is on screen.
 */
export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version: requestedVersionId } = await searchParams;

  let report;
  let user;

  try {
    [report, user] = await Promise.all([getReport(id), getCurrentUser()]);
  } catch (error) {
    // The API answers 404 both for "no such report" and "not yours" -- it
    // deliberately does not distinguish, and neither does this page.
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <ErrorState
        title="Could not load this report"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }

  const isOwner = report.user.id === user.id;
  const isEditable = report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION';

  // Default to the current version; a ?version= param overrides it.
  let shownVersion = report.currentVersion;
  let isViewingPast = false;

  if (requestedVersionId && requestedVersionId !== report.currentVersionId) {
    try {
      shownVersion = await getReportVersion(id, requestedVersionId);
      isViewingPast = true;
    } catch {
      // A bad version id falls back to the current version rather than erroring
      // the whole page.
      shownVersion = report.currentVersion;
    }
  }

  return (
    <>
      <PageHeader
        title={formatWeek(report.weekStartDate, report.weekEndDate)}
        description={`${report.project.name} · ${report.user.name}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={report.status} />
            {isOwner && isEditable ? (
              <Button render={<Link href={`/reports/${report.id}/edit`} />}>{report.status === 'DRAFT' ? 'Edit draft' : 'Make corrections'}</Button>
            ) : null}
          </div>
        }
      />

      {isViewingPast && shownVersion ? (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
          <span className="font-medium">
            Viewing version {shownVersion.versionNumber}
          </span>{' '}
          — a frozen earlier submission.{' '}
          <Link href={`/reports/${report.id}`} className="underline underline-offset-4">
            Back to the current version
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {shownVersion ? (
            <ReportContent version={shownVersion} />
          ) : (
            <ErrorState message="This report has no content yet." />
          )}
        </div>

        <aside className="space-y-6">
          <VersionHistory
            reportId={report.id}
            versions={report.versions}
            currentVersionId={report.currentVersionId}
            selectedVersionId={shownVersion?.id ?? ''}
          />
          <ReviewTrail comments={report.reviewComments} />
        </aside>
      </div>
    </>
  );
}
