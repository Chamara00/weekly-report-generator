import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import {
  ACHIEVEMENTS,
  BLOCKERS,
  LINKS,
  NOTES,
  OVERLOADED_MEMBER,
  PLANNED_TASKS,
  RECURRING_BLOCKER,
  TASKS_BY_PROJECT,
} from './data';

// Builds the content of one ReportVersion.

// Small deterministic spread so different members/weeks do not look identical.
function pick<T>(pool: T[], offset: number): T {
  return pool[Math.abs(offset) % pool.length];
}

function seedOffset(memberKey: string, weekIndex: number, extra = 0): number {
  const letters = memberKey
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return letters + weekIndex * 7 + extra * 3;
}

const PRIORITIES = [
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.CRITICAL,
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
];

const STATUSES = [
  TaskStatus.COMPLETED,
  TaskStatus.COMPLETED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.BLOCKED,
  TaskStatus.CARRIED_OVER,
  TaskStatus.NOT_STARTED,
];

const PLANNED_PERCENTS = [100, 100, 80, 60, 50, 40];

export interface VersionContent {
  notes: string;
  links: string[];
  tasks: {
    name: string;
    priority: TaskPriority;
    plannedPercent: number;
    actualPercent: number;
    status: TaskStatus;
    hoursPlanned: number;
    hoursSpent: number;
    deliverable: string;
  }[];
  plannedTasks: { name: string }[];
  blockers: { description: string; isKeyIssue: boolean }[];
  achievements: { description: string; isKeyAchievement: boolean }[];
  hoursByType: { taskType: TaskType; hours: number }[];
}

const round = (value: number) => Math.round(value * 2) / 2;

export function buildVersionContent(args: {
  memberKey: string;
  projectKey: string;
  weekIndex: number;
  versionNumber: number;
}): VersionContent {
  const { memberKey, projectKey, weekIndex, versionNumber } = args;
  const base = seedOffset(memberKey, weekIndex, versionNumber);
  const pool = TASKS_BY_PROJECT[projectKey];

  // 3-6 tasks, varying by member and week.
  const taskCount = 3 + (base % 4);
  // The overloaded member consistently spends more than planned.
  const overloaded = memberKey === OVERLOADED_MEMBER;
  const spendFactor = overloaded ? 1.35 : 0.95 + (base % 3) * 0.05;

  const tasks = Array.from({ length: taskCount }, (_, index) => {
    const template = pick(pool, base + index);
    const plannedPercent = pick(PLANNED_PERCENTS, base + index);
    const status = pick(STATUSES, base + index);
    const hoursPlanned = 5 + ((base + index * 2) % 5);

    // A later version reflects the manager's feedback: the member fills in more honest actuals.
    const completionBoost = (versionNumber - 1) * 10;
    const actualPercent = Math.min(
      100,
      status === TaskStatus.COMPLETED
        ? 100
        : Math.max(
            0,
            plannedPercent - 20 + ((base + index) % 15) + completionBoost,
          ),
    );

    return {
      name: template.name,
      priority: pick(PRIORITIES, base + index),
      plannedPercent,
      actualPercent,
      status,
      hoursPlanned,
      hoursSpent: round(hoursPlanned * spendFactor),
      deliverable: template.deliverable,
    };
  });

  // 2-4 planned tasks for next week.
  const plannedPool = PLANNED_TASKS[projectKey];
  const plannedCount = 2 + (base % 3);
  const plannedTasks = Array.from({ length: plannedCount }, (_, index) => ({
    name: pick(plannedPool, base + index),
  })).filter(
    (task, index, all) =>
      all.findIndex((other) => other.name === task.name) === index,
  );

  // 1-3 blockers. Every third slot carries the recurring team-wide theme.
  const blockerCount = 1 + (base % 3);
  const blockers = Array.from({ length: blockerCount }, (_, index) => ({
    description:
      index === 0 && base % 3 === 0
        ? RECURRING_BLOCKER
        : pick(BLOCKERS, base + index + 1),
    // Exactly one key issue per report.
    isKeyIssue: index === 0,
  })).filter(
    (blocker, index, all) =>
      all.findIndex((other) => other.description === blocker.description) ===
      index,
  );

  const achievementCount = 1 + ((base + 1) % 3);
  const achievements = Array.from({ length: achievementCount }, (_, index) => ({
    description: pick(ACHIEVEMENTS, base + index),
    // Exactly one key achievement per report.
    isKeyAchievement: index === 0,
  })).filter(
    (item, index, all) =>
      all.findIndex((other) => other.description === item.description) ===
      index,
  );

  // Hours by type add up to roughly the hours actually spent on tasks.
  const totalSpent = tasks.reduce((sum, task) => sum + task.hoursSpent, 0);
  const hoursByType = [
    { taskType: TaskType.DEVELOPMENT, hours: round(totalSpent * 0.55) },
    { taskType: TaskType.TESTING, hours: round(totalSpent * 0.15) },
    { taskType: TaskType.MEETINGS, hours: round(totalSpent * 0.15) },
    { taskType: TaskType.DOCUMENTATION, hours: round(totalSpent * 0.1) },
    { taskType: TaskType.OTHER, hours: round(totalSpent * 0.05) },
  ].filter((entry) => entry.hours > 0);

  return {
    notes:
      versionNumber > 1
        ? `Revised after review feedback. ${pick(NOTES, base)}`
        : pick(NOTES, base),
    links: pick(LINKS, base),
    tasks,
    plannedTasks,
    blockers,
    achievements,
    hoursByType,
  };
}
