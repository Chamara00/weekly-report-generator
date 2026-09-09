import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatWeek } from '@/lib/format';
import type { ReportListItem } from '@/lib/types';

// The correction loop's front door.
export function CorrectionCallout({ reports }: { reports: ReportListItem[] }) {
  if (reports.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200">
            {reports.length === 1
              ? 'A report needs your corrections'
              : `${reports.length} reports need your corrections`}
          </h2>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            A manager reviewed these and asked for changes. Their comments are
            shown at the top of the edit form.
          </p>

          <ul className="mt-3 space-y-2">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-sm dark:border-amber-900 dark:bg-black/20"
              >
                <span>
                  <span className="font-medium">
                    {formatWeek(report.weekStartDate, report.weekEndDate)}
                  </span>
                  <span className="text-muted-foreground"> · {report.project.name}</span>
                </span>
                <Button size="sm" render={<Link href={`/reports/${report.id}/edit`} />}>Make corrections</Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
