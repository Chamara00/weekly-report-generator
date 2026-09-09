import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ReportForm } from '@/components/report-form/report-form';
import { getProjects } from '@/lib/server-api';
import { mondayOf } from '@/lib/format';

export const metadata = { title: 'New report' };

// Server component: loads the project list, then hands off to the client form.
export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>;
}) {
  const { weekStart } = await searchParams;

  let projects;

  try {
    projects = await getProjects();
  } catch (error) {
    return (
      <ErrorState
        title="Could not load projects"
        message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="New weekly report"
        description="Same structure every week, for everyone."
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects exist yet"
          description="A report must be tagged to a project. Ask a manager to create one."
        />
      ) : (
        <ReportForm projects={projects} defaultWeek={weekStart ?? mondayOf()} />
      )}
    </>
  );
}
