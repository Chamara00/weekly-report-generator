import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { ReportForm } from '@/components/report-form/report-form';
import { ApiError, getProjects, getReport } from '@/lib/server-api';
import { formatWeek } from '@/lib/format';

export const metadata = { title: 'Edit report' };

// Edit an existing report.
export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let report;
  let projects;

  try {
    [report, projects] = await Promise.all([getReport(id), getProjects()]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <ErrorState
        title="Could not load this report"
        message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
      />
    );
  }

  const isEditable = report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION';

  if (!isEditable) {
    return (
      <>
        <PageHeader
          title={formatWeek(report.weekStartDate, report.weekEndDate)}
          description={report.project.name}
          actions={<StatusBadge status={report.status} />}
        />
        <ErrorState
          title="This report cannot be edited"
          message={
            report.status === 'APPROVED'
              ? 'It has been approved, so its content is final.'
              : 'It is with a manager for review. You can edit it again only if they request changes.'
          }
        />
        <div className="mt-4">
          <Button variant="outline" render={<Link href={`/reports/${report.id}`} />}>View the report</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={formatWeek(report.weekStartDate, report.weekEndDate)}
        description={`${report.project.name} · editing version ${report.currentVersion?.versionNumber ?? 1}`}
        actions={<StatusBadge status={report.status} />}
      />

      <ReportForm projects={projects} report={report} />
    </>
  );
}
