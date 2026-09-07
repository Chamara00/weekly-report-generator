import { Prisma } from '@prisma/client';

/**
 * Shared Prisma selects.
 *
 * Kept in one file so every endpoint returns the same shape for the same
 * concept, and so a field added to a version's content shows up everywhere at
 * once instead of in whichever query someone remembered to update.
 */

/** Full content of one version. */
export const VERSION_CONTENT_SELECT = {
  id: true,
  versionNumber: true,
  notes: true,
  links: true,
  submittedAt: true,
  createdAt: true,
  tasks: {
    select: {
      id: true,
      name: true,
      priority: true,
      plannedPercent: true,
      actualPercent: true,
      status: true,
      hoursPlanned: true,
      hoursSpent: true,
      deliverable: true,
    },
  },
  plannedTasks: { select: { id: true, name: true } },
  blockers: { select: { id: true, description: true, isKeyIssue: true } },
  achievements: { select: { id: true, description: true, isKeyAchievement: true } },
  hoursByType: { select: { id: true, taskType: true, hours: true } },
} satisfies Prisma.ReportVersionSelect;

/** Lightweight entry for the version-history list on a report. */
export const VERSION_SUMMARY_SELECT = {
  id: true,
  versionNumber: true,
  submittedAt: true,
} satisfies Prisma.ReportVersionSelect;

/** A row in a report list. Deliberately excludes the full content. */
export const REPORT_LIST_SELECT = {
  id: true,
  weekStartDate: true,
  weekEndDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
  currentVersion: { select: VERSION_SUMMARY_SELECT },
  _count: { select: { versions: true, reviewComments: true } },
} satisfies Prisma.ReportSelect;

/** A single report with its current content, history and review trail. */
export const REPORT_DETAIL_SELECT = {
  id: true,
  weekStartDate: true,
  weekEndDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  currentVersionId: true,
  project: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
  currentVersion: { select: VERSION_CONTENT_SELECT },
  versions: {
    select: VERSION_SUMMARY_SELECT,
    orderBy: { versionNumber: 'asc' },
  },
  reviewComments: {
    select: {
      id: true,
      comment: true,
      action: true,
      createdAt: true,
      reportVersionId: true,
      // The version number is what a human reads: "written against v2".
      reportVersion: { select: { versionNumber: true } },
      manager: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ReportSelect;
