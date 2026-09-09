'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/empty-state';
import {
  ApiError,
  createProject,
  deleteProject,
  updateProject,
} from '@/lib/client-api';
import type { Project, TeamMemberStats } from '@/lib/types';
import { ProjectRow } from './project-row';

/**
 * Project CRUD as a page: a create form, then the list with inline editing.
 *
 * Errors are shown verbatim from the API. That matters most for delete, where
 * the backend answers 409 with the exact report count -- surfacing "3 report(s)
 * are filed against it" is far more useful than "could not delete".
 */
export function ProjectsManager({
  projects,
  team,
}: {
  projects: Project[];
  team: TeamMemberStats[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleError(caught: unknown, fallback: string) {
    setError(caught instanceof ApiError ? caught.message : fallback);
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('A project needs a name.');
      return;
    }

    setBusy(true);
    try {
      await createProject({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      toast.success(`Created "${name.trim()}"`);
      setName('');
      setDescription('');
      router.refresh();
    } catch (caught) {
      handleError(caught, 'Could not create the project.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(id: string, values: { name: string; description: string }) {
    setError('');
    setBusy(true);
    try {
      await updateProject(id, values);
      toast.success('Project updated');
      router.refresh();
      return true;
    } catch (caught) {
      handleError(caught, 'Could not update the project.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setError('');
    setBusy(true);
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      router.refresh();
    } catch (caught) {
      // The 409 text names how many reports are blocking the delete.
      handleError(caught, 'Could not delete the project.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New project</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]" onSubmit={handleCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={name}
                disabled={busy}
                placeholder="Client C"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-description">Description (optional)</Label>
              <Input
                id="new-description"
                value={description}
                disabled={busy}
                placeholder="What this project covers"
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>
                {busy ? 'Working…' : 'Add project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Members need at least one project before they can file a report."
        />
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              team={team}
              busy={busy}
              onSave={handleSave}
              onDelete={handleDelete}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
