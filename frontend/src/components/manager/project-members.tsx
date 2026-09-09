'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/shared/select-field';
import { ApiError, addProjectMember, removeProjectMember } from '@/lib/client-api';
import type { Project, TeamMemberStats } from '@/lib/types';

// Assigns people to a project (§5, optional).
export function ProjectMembers({
  project,
  team,
  onError,
}: {
  project: Project;
  team: TeamMemberStats[];
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState('');

  const assigned = project.members ?? [];
  const assignedIds = new Set(assigned.map((entry) => entry.user.id));
  const available = team.filter((member) => !assignedIds.has(member.id));

  async function run(action: () => Promise<unknown>, message: string) {
    setPending(true);
    try {
      await action();
      toast.success(message);
      router.refresh();
    } catch (caught) {
      onError(caught instanceof ApiError ? caught.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-muted-foreground mb-2 text-xs font-medium">Assigned members</p>

      <div className="mb-3 flex flex-wrap gap-2">
        {assigned.length === 0 ? (
          <span className="text-muted-foreground text-sm">Nobody assigned yet.</span>
        ) : (
          assigned.map((entry) => (
            <Badge key={entry.user.id} variant="secondary" className="gap-1 pr-1">
              {entry.user.name}
              <button
                type="button"
                disabled={pending}
                aria-label={`Remove ${entry.user.name} from ${project.name}`}
                className="hover:bg-background/60 rounded p-0.5"
                onClick={() =>
                  run(
                    () => removeProjectMember(project.id, entry.user.id),
                    `${entry.user.name} removed from ${project.name}`,
                  )
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {available.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <SelectField
            id={`assign-${project.id}`}
            value={selected}
            className="w-56"
            placeholder="Choose someone"
            disabled={pending}
            options={available.map((member) => ({ value: member.id, label: member.name }))}
            onChange={setSelected}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !selected}
            onClick={() =>
              run(() => addProjectMember(project.id, selected), 'Member assigned').then(() =>
                setSelected(''),
              )
            }
          >
            Assign
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">Everyone is already assigned.</p>
      )}
    </div>
  );
}
