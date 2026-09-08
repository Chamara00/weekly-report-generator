'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/shared/select-field';
import { humanise } from '@/lib/format';
import { REPORT_STATUSES, type Project, type TeamMemberStats } from '@/lib/types';

const ANY = 'ANY';
const FILTER_KEYS = ['userId', 'projectId', 'status', 'weekStartFrom', 'weekStartTo'];

/**
 * The queue's filters. Every one writes to the URL, so a filtered view is
 * shareable and survives a refresh -- and the server component re-runs the
 * query against the API's own filters rather than hiding rows client-side.
 */
export function QueueFilters({
  members,
  projects,
}: {
  members: TeamMemberStats[];
  projects: Project[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === ANY) params.delete(key);
    else params.set(key, value);

    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key));

  return (
    <div className="mb-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6">
      <SelectField
        id="member"
        label="Team member"
        value={searchParams.get('userId') ?? ANY}
        onChange={(value) => setParam('userId', value)}
        options={[
          { value: ANY, label: 'Everyone' },
          ...members.map((member) => ({ value: member.id, label: member.name })),
        ]}
      />

      <SelectField
        id="status"
        label="Status"
        value={searchParams.get('status') ?? ANY}
        onChange={(value) => setParam('status', value)}
        options={[
          { value: ANY, label: 'Any status' },
          ...REPORT_STATUSES.map((status) => ({ value: status, label: humanise(status) })),
        ]}
      />

      <SelectField
        id="project"
        label="Project"
        value={searchParams.get('projectId') ?? ANY}
        onChange={(value) => setParam('projectId', value)}
        options={[
          { value: ANY, label: 'Any project' },
          ...projects.map((project) => ({ value: project.id, label: project.name })),
        ]}
      />

      <div className="space-y-1.5">
        <Label htmlFor="from">Week from</Label>
        <Input
          id="from"
          type="date"
          defaultValue={searchParams.get('weekStartFrom') ?? ''}
          onChange={(event) => setParam('weekStartFrom', event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="to">Week to</Label>
        <Input
          id="to"
          type="date"
          defaultValue={searchParams.get('weekStartTo') ?? ''}
          onChange={(event) => setParam('weekStartTo', event.target.value)}
        />
      </div>

      <div className="flex items-end">
        <Button
          variant="ghost"
          className="w-full"
          disabled={!hasFilters}
          onClick={() => router.push(pathname)}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
