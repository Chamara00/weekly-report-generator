'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { Project } from '@/lib/types';

/**
 * One project row, which flips between reading and editing IN PLACE.
 *
 * Inline rather than a modal, as the brief asks: the list stays visible while a
 * name is corrected, and the report counts that make a delete fail stay on
 * screen next to the button that will fail.
 */
export function ProjectRow({
  project,
  busy,
  onSave,
  onDelete,
}: {
  project: Project;
  busy: boolean;
  onSave: (id: string, values: { name: string; description: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');

  const reportCount = project._count?.reports ?? 0;

  async function save() {
    const ok = await onSave(project.id, { name: name.trim(), description: description.trim() });
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <Input
          value={name}
          disabled={busy}
          aria-label="Project name"
          onChange={(event) => setName(event.target.value)}
        />
        <Textarea
          rows={2}
          value={description}
          disabled={busy}
          aria-label="Project description"
          placeholder="Description (optional)"
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" disabled={busy || !name.trim()} onClick={save}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setName(project.name);
              setDescription(project.description ?? '');
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{project.name}</p>
        {project.description ? (
          <p className="text-muted-foreground text-sm">{project.description}</p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-xs">
          {reportCount} report{reportCount === 1 ? '' : 's'} ·{' '}
          {project._count?.members ?? 0} member
          {(project._count?.members ?? 0) === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}>
          Edit
        </Button>
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="destructive" disabled={busy}>
              Delete
            </Button>
          }
          title={`Delete "${project.name}"?`}
          description={
            reportCount > 0
              ? `${reportCount} report(s) are filed against this project. The server will refuse to delete it — reports are a historical record and are never cascade-deleted.`
              : 'This project has no reports and can be safely removed.'
          }
          confirmLabel="Delete"
          destructive
          onConfirm={() => onDelete(project.id)}
        />
      </div>
    </div>
  );
}
