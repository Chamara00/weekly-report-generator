// TypeScript mirrors of the backend's response shapes.

export type Role = 'TEAM_MEMBER' | 'MANAGER';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CARRIED_OVER';
export type TaskType =
  | 'DEVELOPMENT'
  | 'TESTING'
  | 'MEETINGS'
  | 'DOCUMENTATION'
  | 'OTHER';
export type ReviewAction = 'APPROVE' | 'REQUEST_CHANGES';

export const REPORT_STATUSES: ReportStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'NEEDS_CORRECTION',
  'APPROVED',
];
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const TASK_STATUSES: TaskStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'CARRIED_OVER',
];
export const TASK_TYPES: TaskType[] = [
  'DEVELOPMENT',
  'TESTING',
  'MEETINGS',
  'DOCUMENTATION',
  'OTHER',
];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  _count?: { reports: number; members: number };
  // Present on GET /projects/:id, absent on the list endpoint.
  members?: { user: { id: string; name: string; email: string; role: Role } }[];
}

export interface Task {
  id?: string;
  name: string;
  priority: TaskPriority;
  plannedPercent: number;
  actualPercent: number;
  status: TaskStatus;
  hoursPlanned: number;
  hoursSpent: number;
  deliverable?: string | null;
}

export interface PlannedTask {
  id?: string;
  name: string;
}

export interface Blocker {
  id?: string;
  description: string;
  isKeyIssue: boolean;
}

export interface Achievement {
  id?: string;
  description: string;
  isKeyAchievement: boolean;
}

export interface HoursByType {
  id?: string;
  taskType: TaskType;
  hours: number;
}

// Full content of one version.
export interface ReportVersion {
  id: string;
  versionNumber: number;
  notes: string | null;
  links: string[];
  submittedAt: string | null;
  createdAt: string;
  tasks: Task[];
  plannedTasks: PlannedTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hoursByType: HoursByType[];
}

// Entry in a report's version-history list.
export interface VersionSummary {
  id: string;
  versionNumber: number;
  submittedAt: string | null;
}

export interface ReviewComment {
  id: string;
  comment: string;
  action: ReviewAction;
  createdAt: string;
  reportVersionId: string;
  reportVersion: { versionNumber: number };
  manager: { id: string; name: string };
}

// A row in a report list.
export interface ReportListItem {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string };
  user: { id: string; name: string; email: string };
  currentVersion: VersionSummary | null;
  _count: { versions: number; reviewComments: number };
}

export interface ReportDetail extends Omit<ReportListItem, 'currentVersion' | '_count'> {
  currentVersionId: string | null;
  currentVersion: ReportVersion | null;
  versions: VersionSummary[];
  reviewComments: ReviewComment[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Query params accepted by the report list endpoints.
export interface ReportQuery {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  projectId?: string;
  weekStartFrom?: string;
  weekStartTo?: string;
  userId?: string;
}

// The body of POST /reports and PATCH /reports/:id.
export interface ReportPayload {
  projectId?: string;
  weekStartDate?: string;
  tasks?: Task[];
  plannedTasks?: PlannedTask[];
  blockers?: Blocker[];
  achievements?: Achievement[];
  hoursByType?: HoursByType[];
  notes?: string;
  links?: string[];
}


// Manager dashboard shapes.

export interface DashboardSummary {
  weekStart: string;
  weekEnd: string;
  reportsSubmittedThisWeek: number;
  compliance: {
    expected: number;
    submitted: number;
    pending: number;
    late: number;
    notStarted: number;
  };
  needsCorrectionCount: number;
  openBlockersCount: number;
}

export interface TrendPoint {
  weekStart: string;
  total: number;
  byMember: { userId: string; name: string; completed: number }[];
}

export interface StatusByMember {
  userId: string;
  name: string;
  total: number;
  byStatus: Record<ReportStatus, number>;
}

export interface DashboardCharts {
  weekStart: string;
  weeks: number;
  tasksCompletedTrend: TrendPoint[];
  statusByMember: StatusByMember[];
  workloadByProject: { projectId: string; name: string; hours: number }[];
  timeByTaskType: { taskType: TaskType; hours: number }[];
}

export interface ActivityItem {
  type: 'SUBMITTED' | 'APPROVE' | 'REQUEST_CHANGES';
  label: string;
  at: string;
  reportId: string;
  versionNumber: number;
  actorName: string;
  ownerName: string;
  projectName: string;
  weekStartDate: string;
  comment: string | null;
}

export interface TeamMemberStats {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalReports: number;
  byStatus: Record<ReportStatus, number>;
  currentWeek: {
    reportId: string | null;
    status: ReportStatus | null;
    hasSubmitted: boolean;
  };
}

export interface TeamOverview {
  currentWeekStart: string;
  members: TeamMemberStats[];
}

export type SectionName = 'BLOCKERS' | 'ACHIEVEMENTS';

export interface SectionView {
  weekStart: string;
  weekEnd: string;
  section: SectionName;
  members: {
    userId: string;
    name: string;
    reportId: string | null;
    status: ReportStatus | null;
    project: { id: string; name: string } | null;
    versionNumber: number | null;
    items: { description: string; isKey: boolean }[];
  }[];
}


// User administration (manager-only).

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { reports: number };
}

export interface InviteResult {
  user: ManagedUser;
  // Shown once so the manager can pass it on; never retrievable again.
  temporaryPassword: string;
}
