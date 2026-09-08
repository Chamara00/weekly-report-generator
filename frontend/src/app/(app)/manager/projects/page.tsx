import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { ProjectsManager } from '@/components/manager/projects-manager';
import { getProjects } from '@/lib/server-api';

export const metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  let projects;

  try {
    projects = await getProjects();
  } catch (error) {
    return (
      <ErrorState
        title="Could not load projects"
        message={error instanceof Error ? error.message : 'The API did not respond.'}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every report is tagged to a project. A project with reports cannot be deleted."
      />

      <ProjectsManager projects={projects} />
    </>
  );
}
