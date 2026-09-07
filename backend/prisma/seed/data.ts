import { Role } from '@prisma/client';

/**
 * Static inputs for the seed. Everything here is deterministic: re-running the
 * seed must produce an identical dataset, so there is no Math.random anywhere.
 */

export const SEED_PASSWORD = 'password123';

export interface SeedPerson {
  key: string;
  name: string;
  email: string;
  role: Role;
}

export const PEOPLE: SeedPerson[] = [
  { key: 'elena', name: 'Elena Vasquez', email: 'elena.vasquez@example.com', role: Role.MANAGER },
  { key: 'tom', name: 'Tom Whitfield', email: 'tom.whitfield@example.com', role: Role.MANAGER },
  { key: 'priya', name: 'Priya Raman', email: 'priya.raman@example.com', role: Role.TEAM_MEMBER },
  { key: 'marcus', name: 'Marcus Bell', email: 'marcus.bell@example.com', role: Role.TEAM_MEMBER },
  { key: 'sofia', name: 'Sofia Lindqvist', email: 'sofia.lindqvist@example.com', role: Role.TEAM_MEMBER },
  { key: 'daniel', name: 'Daniel Okafor', email: 'daniel.okafor@example.com', role: Role.TEAM_MEMBER },
  { key: 'yuki', name: 'Yuki Tanaka', email: 'yuki.tanaka@example.com', role: Role.TEAM_MEMBER },
];

/** The member who is consistently over capacity -- a story the dashboard tells. */
export const OVERLOADED_MEMBER = 'priya';

export interface SeedProject {
  key: string;
  name: string;
  description: string;
  /** Member keys assigned via ProjectMember. */
  members: string[];
}

export const PROJECTS: SeedProject[] = [
  {
    key: 'client-a',
    name: 'Client A',
    description: 'Payments platform rebuild for the largest retained client.',
    members: ['priya', 'marcus', 'sofia'],
  },
  {
    key: 'client-b',
    name: 'Client B',
    description: 'Logistics portal maintenance and quarterly feature drops.',
    members: ['daniel', 'yuki'],
  },
  {
    key: 'internal-tooling',
    name: 'Internal Tooling',
    description: 'CI, deployment and developer experience work.',
    members: ['marcus', 'yuki'],
  },
  {
    key: 'rnd',
    name: 'R&D',
    description: 'Prototypes and technical spikes ahead of next quarter.',
    members: ['sofia', 'priya'],
  },
  {
    key: 'marketing',
    name: 'Marketing',
    description: 'Public site, campaign landing pages and analytics.',
    members: ['daniel'],
  },
];

/** Task names per project, so a report reads like it belongs to its project. */
export const TASKS_BY_PROJECT: Record<string, { name: string; deliverable: string }[]> = {
  'client-a': [
    { name: 'Refund flow API endpoints', deliverable: 'PR #412' },
    { name: 'Payment retry backoff logic', deliverable: 'PR #418' },
    { name: 'Settlement reconciliation report', deliverable: 'Report spec v2' },
    { name: 'Card tokenisation migration', deliverable: 'Migration runbook' },
    { name: 'Load testing the checkout path', deliverable: 'k6 results doc' },
    { name: 'Client A integration review call', deliverable: 'Meeting notes' },
  ],
  'client-b': [
    { name: 'Shipment tracking webhooks', deliverable: 'PR #201' },
    { name: 'Warehouse dashboard filters', deliverable: 'PR #205' },
    { name: 'Carrier rate-limit handling', deliverable: 'PR #209' },
    { name: 'Bulk label export', deliverable: 'Feature demo' },
    { name: 'Quarterly upgrade dry run', deliverable: 'Upgrade checklist' },
  ],
  'internal-tooling': [
    { name: 'Split CI pipeline into stages', deliverable: 'PR #77' },
    { name: 'Preview environments per PR', deliverable: 'Infra RFC' },
    { name: 'Flaky test quarantine', deliverable: 'Test report' },
    { name: 'Local dev setup script', deliverable: 'README update' },
    { name: 'Secrets rotation automation', deliverable: 'PR #81' },
  ],
  rnd: [
    { name: 'Vector search spike', deliverable: 'Spike write-up' },
    { name: 'Event sourcing prototype', deliverable: 'Prototype repo' },
    { name: 'Cost model for streaming ingest', deliverable: 'Cost sheet' },
    { name: 'Benchmark report drafting', deliverable: 'Benchmark doc' },
  ],
  marketing: [
    { name: 'Campaign landing page build', deliverable: 'Staging link' },
    { name: 'Analytics event taxonomy', deliverable: 'Tracking plan' },
    { name: 'Case study page copy', deliverable: 'CMS draft' },
    { name: 'Accessibility audit fixes', deliverable: 'Audit checklist' },
  ],
};

export const PLANNED_TASKS: Record<string, string[]> = {
  'client-a': [
    'Finish settlement edge cases',
    'Pair with QA on refund regressions',
    'Draft the tokenisation rollout plan',
    'Review Client A change requests',
  ],
  'client-b': [
    'Ship carrier rate-limit fix',
    'Start bulk label export UI',
    'Prepare the quarterly upgrade notes',
  ],
  'internal-tooling': [
    'Enable preview envs for two repos',
    'Cut CI runtime below 8 minutes',
    'Document the new secrets flow',
  ],
  rnd: [
    'Summarise the vector search findings',
    'Scope the event sourcing follow-up',
    'Circulate the benchmark draft',
  ],
  marketing: [
    'Publish the campaign page',
    'Wire up the new analytics events',
    'Second pass on case study copy',
  ],
};

/**
 * Blockers. The first entry of every list is the recurring theme -- staging
 * instability -- so the dashboard can surface a blocker affecting the team.
 */
export const RECURRING_BLOCKER = 'Staging environment keeps dropping the database connection';

export const BLOCKERS: string[] = [
  RECURRING_BLOCKER,
  'Waiting on Client A to supply sandbox API credentials',
  'Design review slipped, so the UI work is on hold',
  'Flaky end-to-end tests hide real regressions',
  'Blocked on an infra ticket for the new queue',
];

export const ACHIEVEMENTS: string[] = [
  'Cut checkout p95 latency by 40%',
  'Closed the last of the migration follow-ups',
  'Onboarded a new teammate onto the codebase',
  'Automated a release step that was manual for a year',
  'Shipped ahead of the agreed client deadline',
];

export const NOTES: string[] = [
  'Quieter week than planned; two days lost to incident support.',
  'Good week overall, the client demo landed well.',
  'Most of the week went on unplanned production issues.',
  'Steady progress, nothing surprising to report.',
];

export const LINKS: string[][] = [
  ['https://github.com/example/weekly-report-hub/pull/412'],
  ['https://example.atlassian.net/browse/WRH-118', 'https://example.com/design/checkout'],
  [],
];
