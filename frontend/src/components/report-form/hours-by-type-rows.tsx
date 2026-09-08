'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { humanise } from '@/lib/format';
import { TASK_TYPES, type HoursByType, type TaskType } from '@/lib/types';

/**
 * Optional hours breakdown.
 *
 * Every TaskType is always rendered, because the backend stores at most one row
 * per type per version (a unique constraint). Rows left at zero are dropped
 * before sending rather than saved as noise.
 */
export function HoursByTypeRows({
  entries,
  disabled,
  taskHoursTotal,
  onChange,
}: {
  entries: HoursByType[];
  disabled: boolean;
  /** Total hours spent across tasks, shown so a member can sanity-check. */
  taskHoursTotal: number;
  onChange: (entries: HoursByType[]) => void;
}) {
  function hoursFor(taskType: TaskType): number {
    return entries.find((entry) => entry.taskType === taskType)?.hours ?? 0;
  }

  function setHours(taskType: TaskType, hours: number) {
    const others = entries.filter((entry) => entry.taskType !== taskType);
    onChange([...others, { taskType, hours }]);
  }

  const total = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TASK_TYPES.map((taskType) => (
          <div key={taskType}>
            <Label htmlFor={`hours-${taskType}`}>{humanise(taskType)}</Label>
            <Input
              id={`hours-${taskType}`}
              type="number"
              min={0}
              step={0.5}
              value={hoursFor(taskType)}
              disabled={disabled}
              onChange={(event) => setHours(taskType, Number(event.target.value))}
            />
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        Breakdown total: <span className="tabular-nums font-medium">{total}h</span> · hours
        spent on tasks above: <span className="tabular-nums font-medium">{taskHoursTotal}h</span>
        {total > 0 && Math.abs(total - taskHoursTotal) > 0.5
          ? ' — these do not match, which is allowed but worth a check.'
          : ''}
      </p>
    </div>
  );
}
