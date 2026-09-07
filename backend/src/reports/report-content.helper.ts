import { Prisma } from '@prisma/client';
import { VersionContentDto } from './dto/version-content.dto';

/**
 * Turns validated DTO content into the nested `create` payload Prisma expects,
 * and copies an existing version's content forward onto a new one.
 *
 * Kept out of the service so the service reads as authorization + state machine
 * rather than as data plumbing.
 */

/** The child rows of a version, as loaded from the database. */
export interface ExistingVersionContent {
  notes: string | null;
  links: string[];
  tasks: Prisma.TaskUncheckedCreateWithoutReportVersionInput[];
  plannedTasks: { name: string }[];
  blockers: { description: string; isKeyIssue: boolean }[];
  achievements: { description: string; isKeyAchievement: boolean }[];
  hoursByType: Prisma.HoursByTypeUncheckedCreateWithoutReportVersionInput[];
}

/** Strips database-only fields (ids, foreign keys) so a row can be re-created. */
function stripIds<T extends Record<string, unknown>>(rows: T[]): Omit<T, 'id' | 'reportVersionId'>[] {
  return rows.map((row) => {
    const { id: _id, reportVersionId: _fk, ...rest } = row as Record<string, unknown>;
    return rest as Omit<T, 'id' | 'reportVersionId'>;
  });
}

/**
 * Merges a content patch over an existing version.
 *
 * An omitted array means "unchanged", which is what makes PATCH partial: a
 * request that only sends `blockers` keeps the tasks from the previous version
 * verbatim. Passing an empty array is different -- that clears the section.
 */
export function mergeContent(
  previous: ExistingVersionContent,
  patch: VersionContentDto,
): ExistingVersionContent {
  return {
    notes: patch.notes !== undefined ? patch.notes : previous.notes,
    links: patch.links !== undefined ? patch.links : previous.links,
    tasks: patch.tasks !== undefined ? patch.tasks.map(normaliseTask) : previous.tasks,
    plannedTasks: patch.plannedTasks !== undefined ? patch.plannedTasks : previous.plannedTasks,
    blockers:
      patch.blockers !== undefined
        ? patch.blockers.map((blocker) => ({
            description: blocker.description,
            isKeyIssue: blocker.isKeyIssue ?? false,
          }))
        : previous.blockers,
    achievements:
      patch.achievements !== undefined
        ? patch.achievements.map((achievement) => ({
            description: achievement.description,
            isKeyAchievement: achievement.isKeyAchievement ?? false,
          }))
        : previous.achievements,
    hoursByType: patch.hoursByType !== undefined ? patch.hoursByType : previous.hoursByType,
  };
}

function normaliseTask(task: NonNullable<VersionContentDto['tasks']>[number]) {
  return {
    name: task.name,
    priority: task.priority,
    plannedPercent: task.plannedPercent,
    actualPercent: task.actualPercent,
    status: task.status,
    hoursPlanned: task.hoursPlanned,
    hoursSpent: task.hoursSpent,
    deliverable: task.deliverable ?? null,
  };
}

/** Content of a brand-new version, from a DTO alone. */
export function contentFromDto(dto: VersionContentDto): ExistingVersionContent {
  return mergeContent(
    {
      notes: null,
      links: [],
      tasks: [],
      plannedTasks: [],
      blockers: [],
      achievements: [],
      hoursByType: [],
    },
    dto,
  );
}

/** Normalises rows loaded from Prisma into the shape mergeContent expects. */
export function contentFromVersion(version: {
  notes: string | null;
  links: string[];
  tasks: Record<string, unknown>[];
  plannedTasks: Record<string, unknown>[];
  blockers: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  hoursByType: Record<string, unknown>[];
}): ExistingVersionContent {
  return {
    notes: version.notes,
    links: version.links,
    tasks: stripIds(version.tasks) as ExistingVersionContent['tasks'],
    plannedTasks: stripIds(version.plannedTasks) as { name: string }[],
    blockers: stripIds(version.blockers) as ExistingVersionContent['blockers'],
    achievements: stripIds(version.achievements) as ExistingVersionContent['achievements'],
    hoursByType: stripIds(version.hoursByType) as ExistingVersionContent['hoursByType'],
  };
}

/** The nested-create payload for a ReportVersion's children. */
export function nestedCreateFor(content: ExistingVersionContent) {
  return {
    notes: content.notes,
    links: content.links,
    tasks: { create: content.tasks },
    plannedTasks: { create: content.plannedTasks },
    blockers: { create: content.blockers },
    achievements: { create: content.achievements },
    hoursByType: { create: content.hoursByType },
  };
}
