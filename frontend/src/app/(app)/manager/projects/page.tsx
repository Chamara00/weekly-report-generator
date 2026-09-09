import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { ProjectsManager } from '@/components/manager/projects-manager';
import { getProject, getProjects, getTeam } from '@/lib/server-api';

export const metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  let projects;
  let team;

  try {
    // The list endpoint returns counts only, so each project is re-fetched for its member list.
    const [summaries, teamOverview] = await Promise.all([getProjects(), getTeam()]);
    projects = await Promise.all(summaries.map((project) => getProject(project.id)));
    team = teamOverview.members;
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

      <ProjectsManager projects={projects} team={team} />
    </>
  );
}
