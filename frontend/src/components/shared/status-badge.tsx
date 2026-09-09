import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { humanise } from '@/lib/format';
import type { ReportStatus } from '@/lib/types';

// The single source of truth for how a status looks.
const STYLES: Record<ReportStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900',
  NEEDS_CORRECTION:
    'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  APPROVED:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
};

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STYLES[status], 'font-medium', className)}>
      {humanise(status)}
    </Badge>
  );
}
