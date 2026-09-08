'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/shared/select-field';
import { humanise } from '@/lib/format';
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '@/lib/types';
import { FieldError } from './field-error';
import { emptyTask } from './use-report-form';

/**
 * The dynamic task table.
 *
 * One card per task rather than a literal <table>: a task has eight fields, and
 * eight columns are unusable on a phone. This keeps every field labelled and
 * lets the grid reflow.
 */
export function TaskRows({
  tasks,
  errors,
  disabled,
  onChange,
}: {
  tasks: Task[];
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (tasks: Task[]) => void;
}) {
  function update(index: number, changes: Partial<Task>) {
    onChange(tasks.map((task, i) => (i === index ? { ...task, ...changes } : task)));
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div key={index} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Task {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || tasks.length === 1}
              onClick={() => onChange(tasks.filter((_, i) => i !== index))}
              aria-label={`Remove task ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor={`task-name-${index}`}>Task name</Label>
              <Input
                id={`task-name-${index}`}
                value={task.name}
                disabled={disabled}
                onChange={(event) => update(index, { name: event.target.value })}
                aria-invalid={Boolean(errors[`tasks.${index}.name`])}
              />
              <FieldError message={errors[`tasks.${index}.name`]} />
            </div>

            <SelectField
              id={`task-priority-${index}`}
              label="Priority"
              value={task.priority}
              disabled={disabled}
              options={TASK_PRIORITIES.map((priority) => ({
                value: priority,
                label: humanise(priority),
              }))}
              onChange={(value) => update(index, { priority: value as Task['priority'] })}
            />

            <SelectField
              id={`task-status-${index}`}
              label="Status"
              value={task.status}
              disabled={disabled}
              options={TASK_STATUSES.map((status) => ({
                value: status,
                label: humanise(status),
              }))}
              onChange={(value) => update(index, { status: value as Task['status'] })}
            />

            <NumberField
              id={`task-planned-${index}`}
              label="Planned %"
              value={task.plannedPercent}
              error={errors[`tasks.${index}.plannedPercent`]}
              disabled={disabled}
              max={100}
              onChange={(value) => update(index, { plannedPercent: value })}
            />
            <NumberField
              id={`task-actual-${index}`}
              label="Actual %"
              value={task.actualPercent}
              error={errors[`tasks.${index}.actualPercent`]}
              disabled={disabled}
              max={100}
              onChange={(value) => update(index, { actualPercent: value })}
            />
            <NumberField
              id={`task-hp-${index}`}
              label="Hours planned"
              value={task.hoursPlanned}
              error={errors[`tasks.${index}.hoursPlanned`]}
              disabled={disabled}
              step={0.5}
              onChange={(value) => update(index, { hoursPlanned: value })}
            />
            <NumberField
              id={`task-hs-${index}`}
              label="Hours spent"
              value={task.hoursSpent}
              error={errors[`tasks.${index}.hoursSpent`]}
              disabled={disabled}
              step={0.5}
              onChange={(value) => update(index, { hoursSpent: value })}
            />

            <div className="sm:col-span-2 lg:col-span-4">
              <Label htmlFor={`task-deliverable-${index}`}>Deliverable (optional)</Label>
              <Input
                id={`task-deliverable-${index}`}
                value={task.deliverable ?? ''}
                disabled={disabled}
                placeholder="PR #412, design doc, demo link…"
                onChange={(event) => update(index, { deliverable: event.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => onChange([...tasks, emptyTask()])}
      >
        Add task
      </Button>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  error,
  disabled,
  max,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  error?: string;
  disabled: boolean;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <FieldError message={error} />
    </div>
  );
}
