'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/shared/select-field';
import { humanise } from '@/lib/format';
import { REPORT_STATUSES, type Project } from '@/lib/types';

const ANY = 'ANY';

// Filters that write straight to the URL query string.
export function ReportFilters({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === ANY) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Any filter change invalidates the current page number.
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ['status', 'projectId', 'weekStartFrom', 'weekStartTo'].some((key) =>
    searchParams.has(key),
  );

  return (
    <div className="mb-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5">
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
