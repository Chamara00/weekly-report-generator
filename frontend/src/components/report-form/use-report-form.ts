'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  ValidationError,
  createReport,
  submitReport,
  updateReport,
} from '@/lib/client-api';
import { isMonday } from '@/lib/format';
import type {
  Achievement,
  Blocker,
  HoursByType,
  PlannedTask,
  ReportDetail,
  ReportPayload,
  Task,
} from '@/lib/types';

export interface ReportFormState {
  projectId: string;
  weekStartDate: string;
  tasks: Task[];
  plannedTasks: PlannedTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hoursByType: HoursByType[];
  notes: string;
  links: string[];
}

export const emptyTask = (): Task => ({
  name: '',
  priority: 'MEDIUM',
  plannedPercent: 100,
  actualPercent: 0,
  status: 'NOT_STARTED',
  hoursPlanned: 0,
  hoursSpent: 0,
  deliverable: '',
});

/** Seeds the form from an existing report, or from blank for a new one. */
export function initialState(report?: ReportDetail, weekStart?: string): ReportFormState {
  const version = report?.currentVersion;

  return {
    projectId: report?.project.id ?? '',
    weekStartDate: report?.weekStartDate.slice(0, 10) ?? weekStart ?? '',
    tasks: version?.tasks.map((task) => ({ ...task, deliverable: task.deliverable ?? '' })) ?? [
      emptyTask(),
    ],
    plannedTasks: version?.plannedTasks ?? [],
    blockers: version?.blockers ?? [],
    achievements: version?.achievements ?? [],
    hoursByType: version?.hoursByType ?? [],
    notes: version?.notes ?? '',
    links: version?.links ?? [],
  };
}

/**
 * Client-side validation mirroring the backend DTOs.
 *
 * The server rules are authoritative -- this exists so a member is told about a
 * bad percentage before a round trip, not instead of the backend checking.
 * Error keys match the API's message paths ("tasks.0.name") so server errors
 * can be dropped into the same map.
 */
function validate(state: ReportFormState, requireWeek: boolean): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.projectId) errors.projectId = 'Choose a project';

  if (requireWeek) {
    if (!state.weekStartDate) errors.weekStartDate = 'Choose the week';
    else if (!isMonday(state.weekStartDate))
      errors.weekStartDate = 'The week must start on a Monday';
  }

  state.tasks.forEach((task, index) => {
    if (!task.name.trim()) errors[`tasks.${index}.name`] = 'Task name is required';
    for (const field of ['plannedPercent', 'actualPercent'] as const) {
      const value = task[field];
      if (value < 0 || value > 100) errors[`tasks.${index}.${field}`] = 'Must be 0–100';
    }
    for (const field of ['hoursPlanned', 'hoursSpent'] as const) {
      if (task[field] < 0) errors[`tasks.${index}.${field}`] = 'Cannot be negative';
    }
  });

  state.plannedTasks.forEach((task, index) => {
    if (!task.name.trim()) errors[`plannedTasks.${index}.name`] = 'Cannot be empty';
  });

  state.blockers.forEach((blocker, index) => {
    if (!blocker.description.trim())
      errors[`blockers.${index}.description`] = 'Cannot be empty';
  });

  state.achievements.forEach((achievement, index) => {
    if (!achievement.description.trim())
      errors[`achievements.${index}.description`] = 'Cannot be empty';
  });

  state.links.forEach((link, index) => {
    if (link.trim() && !/^https?:\/\/\S+$/i.test(link.trim()))
      errors[`links.${index}`] = 'Must be a full URL (https://…)';
  });

  return errors;
}

/** Strips empty rows and normalises types before sending. */
function toPayload(state: ReportFormState, includeWeek: boolean): ReportPayload {
  return {
    projectId: state.projectId,
    ...(includeWeek ? { weekStartDate: state.weekStartDate } : {}),
    tasks: state.tasks
      .filter((task) => task.name.trim())
      .map((task) => ({
        name: task.name.trim(),
        priority: task.priority,
        plannedPercent: Number(task.plannedPercent),
        actualPercent: Number(task.actualPercent),
        status: task.status,
        hoursPlanned: Number(task.hoursPlanned),
        hoursSpent: Number(task.hoursSpent),
        ...(task.deliverable?.trim() ? { deliverable: task.deliverable.trim() } : {}),
      })),
    plannedTasks: state.plannedTasks
      .filter((task) => task.name.trim())
      .map((task) => ({ name: task.name.trim() })),
    blockers: state.blockers
      .filter((blocker) => blocker.description.trim())
      .map((blocker) => ({
        description: blocker.description.trim(),
        isKeyIssue: blocker.isKeyIssue,
      })),
    achievements: state.achievements
      .filter((achievement) => achievement.description.trim())
      .map((achievement) => ({
        description: achievement.description.trim(),
        isKeyAchievement: achievement.isKeyAchievement,
      })),
    hoursByType: state.hoursByType
      .filter((entry) => Number(entry.hours) > 0)
      .map((entry) => ({ taskType: entry.taskType, hours: Number(entry.hours) })),
    notes: state.notes.trim(),
    links: state.links.map((link) => link.trim()).filter(Boolean),
  };
}

export function useReportForm(report: ReportDetail | undefined, defaultWeek?: string) {
  const router = useRouter();
  const [state, setState] = useState<ReportFormState>(() => initialState(report, defaultWeek));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState<'draft' | 'submit' | null>(null);

  function patch(changes: Partial<ReportFormState>) {
    setState((current) => ({ ...current, ...changes }));
  }

  async function save(action: 'draft' | 'submit') {
    setFormError('');
    const isNew = !report;
    const found = validate(state, isNew);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      setFormError('Some fields need attention. See the messages below.');
      return;
    }

    setPending(action);

    try {
      const saved = report
        ? await updateReport(report.id, toPayload(state, false))
        : await createReport(toPayload(state, true));

      if (action === 'submit') {
        await submitReport(saved.id);
      }

      // refresh() so the server components behind this page (dashboard counts,
      // report list) re-fetch rather than serving a stale cache.
      router.push(`/reports/${saved.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ValidationError) {
        // Backend messages start with their field path, so they slot into the
        // same map the client-side rules use.
        const mapped: Record<string, string> = {};
        for (const message of error.messages) {
          const field = message.split(' ')[0];
          mapped[field] ??= message;
        }
        setErrors(mapped);
        setFormError('The server rejected some fields. See the messages below.');
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Could not reach the server. Your changes were not saved.');
      }
    } finally {
      setPending(null);
    }
  }

  return { state, patch, setState, errors, formError, pending, save };
}
