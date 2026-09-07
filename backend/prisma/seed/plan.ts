import { ReportStatus, ReviewAction } from '@prisma/client';

/**
 * The explicit list of reports to create.
 *
 * Written out by hand rather than generated so the dataset is easy to reason
 * about: you can read off exactly which weeks have gaps, which reports carry
 * multiple versions, and how the statuses are spread.
 *
 * weekIndex 0 is the OLDEST of the six weeks; weekIndex 5 is THE CURRENT WEEK,
 * which is only partly filled in. Missing (member, week) pairs are deliberate
 * gaps that exercise the dashboard's "not yet started" state.
 */
export interface ReportPlanEntry {
  memberKey: string;
  weekIndex: number;
  projectKey: string;
  status: ReportStatus;
  /** How many versions of content exist. >1 means the report was sent back. */
  versions: number;
}

export const REPORT_PLAN: ReportPlanEntry[] = [
  // --- Week 0 -------------------------------------------------------------
  { memberKey: 'priya', weekIndex: 0, projectKey: 'client-a', status: ReportStatus.APPROVED, versions: 1 },
  { memberKey: 'marcus', weekIndex: 0, projectKey: 'internal-tooling', status: ReportStatus.APPROVED, versions: 1 },
  { memberKey: 'sofia', weekIndex: 0, projectKey: 'rnd', status: ReportStatus.APPROVED, versions: 2 },
  { memberKey: 'daniel', weekIndex: 0, projectKey: 'client-b', status: ReportStatus.APPROVED, versions: 1 },
  // yuki: gap.

  // --- Week 1 -------------------------------------------------------------
  { memberKey: 'priya', weekIndex: 1, projectKey: 'client-a', status: ReportStatus.APPROVED, versions: 3 },
  { memberKey: 'marcus', weekIndex: 1, projectKey: 'client-a', status: ReportStatus.APPROVED, versions: 1 },
  { memberKey: 'sofia', weekIndex: 1, projectKey: 'client-a', status: ReportStatus.APPROVED, versions: 1 },
  { memberKey: 'yuki', weekIndex: 1, projectKey: 'client-b', status: ReportStatus.APPROVED, versions: 1 },
  // daniel: gap.

  // --- Week 2 -------------------------------------------------------------
  { memberKey: 'priya', weekIndex: 2, projectKey: 'client-a', status: ReportStatus.APPROVED, versions: 1 },
  { memberKey: 'marcus', weekIndex: 2, projectKey: 'internal-tooling', status: ReportStatus.SUBMITTED, versions: 2 },
  { memberKey: 'sofia', weekIndex: 2, projectKey: 'rnd', status: ReportStatus.APPROVED, versions: 1 },
  { memberKey: 'daniel', weekIndex: 2, projectKey: 'marketing', status: ReportStatus.SUBMITTED, versions: 1 },
  { memberKey: 'yuki', weekIndex: 2, projectKey: 'internal-tooling', status: ReportStatus.SUBMITTED, versions: 1 },

  // --- Week 3 -------------------------------------------------------------
  { memberKey: 'priya', weekIndex: 3, projectKey: 'client-a', status: ReportStatus.APPROVED, versions: 2 },
  { memberKey: 'marcus', weekIndex: 3, projectKey: 'client-a', status: ReportStatus.SUBMITTED, versions: 1 },
  { memberKey: 'sofia', weekIndex: 3, projectKey: 'client-a', status: ReportStatus.NEEDS_CORRECTION, versions: 1 },
  { memberKey: 'daniel', weekIndex: 3, projectKey: 'client-b', status: ReportStatus.SUBMITTED, versions: 1 },
  // A draft from a past week: started, never handed in.
  { memberKey: 'yuki', weekIndex: 3, projectKey: 'internal-tooling', status: ReportStatus.DRAFT, versions: 1 },

  // --- Week 4 -------------------------------------------------------------
  { memberKey: 'priya', weekIndex: 4, projectKey: 'client-a', status: ReportStatus.SUBMITTED, versions: 2 },
  { memberKey: 'marcus', weekIndex: 4, projectKey: 'internal-tooling', status: ReportStatus.APPROVED, versions: 1 },
  { memberKey: 'sofia', weekIndex: 4, projectKey: 'rnd', status: ReportStatus.NEEDS_CORRECTION, versions: 2 },
  { memberKey: 'daniel', weekIndex: 4, projectKey: 'marketing', status: ReportStatus.SUBMITTED, versions: 1 },
  { memberKey: 'yuki', weekIndex: 4, projectKey: 'client-b', status: ReportStatus.NEEDS_CORRECTION, versions: 1 },

  // --- Week 5 = THE CURRENT WEEK, deliberately part-finished ---------------
  // Two members have submitted, one is still drafting, and two have not
  // started at all. That is what gives the dashboard a real compliance rate
  // and a non-empty "not yet started" list.
  { memberKey: 'priya', weekIndex: 5, projectKey: 'client-a', status: ReportStatus.SUBMITTED, versions: 1 },
  { memberKey: 'marcus', weekIndex: 5, projectKey: 'client-a', status: ReportStatus.SUBMITTED, versions: 1 },
  { memberKey: 'sofia', weekIndex: 5, projectKey: 'rnd', status: ReportStatus.DRAFT, versions: 1 },
  // daniel: not started this week.
  // yuki:   not started this week.
];

export interface ReviewStep {
  /** 1-based version the comment was written against. */
  versionNumber: number;
  action: ReviewAction;
  comment: string;
}

const REQUEST_COMMENTS = [
  'Hours look under-reported against the tasks listed. Please add the actual time spent and resubmit.',
  'Two tasks are still marked in progress with no blocker recorded. Add context before I sign this off.',
  'Please split the migration work into separate tasks so we can track it properly.',
];

const APPROVE_COMMENTS = [
  'Thanks, this is clear. Approved.',
  'Good detail on the blockers. Approved.',
  'Approved, and nice work on the deadline.',
];

/**
 * Derives the review trail from a report's status and version count.
 *
 * The rule: every version after the first exists BECAUSE a manager requested
 * changes on the one before it, so versions 1..n-1 each carry a
 * REQUEST_CHANGES. What happens to the final version depends on the status:
 * APPROVED adds an APPROVE, NEEDS_CORRECTION adds another REQUEST_CHANGES,
 * SUBMITTED means it is still waiting and gets nothing.
 */
export function buildReviewSteps(entry: ReportPlanEntry, offset: number): ReviewStep[] {
  if (entry.status === ReportStatus.DRAFT) return [];

  const steps: ReviewStep[] = [];

  for (let version = 1; version < entry.versions; version += 1) {
    steps.push({
      versionNumber: version,
      action: ReviewAction.REQUEST_CHANGES,
      comment: REQUEST_COMMENTS[(offset + version) % REQUEST_COMMENTS.length],
    });
  }

  if (entry.status === ReportStatus.APPROVED) {
    steps.push({
      versionNumber: entry.versions,
      action: ReviewAction.APPROVE,
      comment: APPROVE_COMMENTS[offset % APPROVE_COMMENTS.length],
    });
  } else if (entry.status === ReportStatus.NEEDS_CORRECTION) {
    steps.push({
      versionNumber: entry.versions,
      action: ReviewAction.REQUEST_CHANGES,
      comment: REQUEST_COMMENTS[offset % REQUEST_COMMENTS.length],
    });
  }

  return steps;
}
