import 'server-only';
import { cookies } from 'next/headers';
import { ApiError, apiFetch } from './api';
import { AUTH_COOKIE } from './auth-cookie';
import type {
  ActivityItem,
  AuthUser,
  DashboardCharts,
  DashboardSummary,
  ManagedUser,
  Paginated,
  Project,
  ReportDetail,
  ReportListItem,
  ReportQuery,
  ReportVersion,
  Role,
  SectionView,
  TeamOverview,
} from './types';

/**
 * Server-side data fetching.
 *
 * The JWT lives in an httpOnly cookie, so browser JavaScript cannot read it.
 * These functions run on the server, pull the cookie out of the request, and
 * pass it to Nest as `Authorization: Bearer <token>` -- which is the only form
 * the backend's JwtStrategy accepts. Client components mutate through
 * /api/proxy instead, which does the same translation for writes.
 */

async function token(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value;
}

async function serverFetch<T>(path: string): Promise<T> {
  return apiFetch<T>(path, {
    token: await token(),
    // Always hit the API: reports change constantly and a cached dashboard
    // would show stale statuses right after a submit.
    cache: 'no-store',
  });
}

/** Turns a partial query object into a query string, skipping empty values. */
export function toQueryString(
  query: Record<string, string | number | undefined> | ReportQuery,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query) as [string, string | number | undefined][]) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

export function getCurrentUser(): Promise<AuthUser> {
  return serverFetch<AuthUser>('/auth/me');
}

export function getProjects(): Promise<Project[]> {
  return serverFetch<Project[]>('/projects');
}

export function getMyReports(query: ReportQuery = {}): Promise<Paginated<ReportListItem>> {
  return serverFetch<Paginated<ReportListItem>>(`/reports${toQueryString(query)}`);
}

export function getReport(id: string): Promise<ReportDetail> {
  return serverFetch<ReportDetail>(`/reports/${id}`);
}

export function getReportVersion(
  reportId: string,
  versionId: string,
): Promise<ReportVersion> {
  return serverFetch<ReportVersion>(`/reports/${reportId}/versions/${versionId}`);
}

/** Re-exported so pages can narrow on status codes without a second import. */
export { ApiError };

// ---------------------------------------------------------------------------
// Manager-only reads. RolesGuard rejects these for a TEAM_MEMBER, so the pages
// that call them live behind /manager, which middleware also guards.
// ---------------------------------------------------------------------------

export function getTeamReports(
  query: ReportQuery = {},
): Promise<Paginated<ReportListItem>> {
  return serverFetch<Paginated<ReportListItem>>(
    `/manager/reports${toQueryString(query)}`,
  );
}

export function getTeamReport(id: string): Promise<ReportDetail> {
  return serverFetch<ReportDetail>(`/manager/reports/${id}`);
}

export function getTeam(): Promise<TeamOverview> {
  return serverFetch<TeamOverview>('/manager/team');
}

export function getDashboardSummary(weekStart?: string): Promise<DashboardSummary> {
  return serverFetch<DashboardSummary>(
    `/manager/dashboard/summary${toQueryString({ weekStart })}`,
  );
}

export function getDashboardCharts(query: {
  weekStart?: string;
  weeks?: number;
  userId?: string;
  projectId?: string;
}): Promise<DashboardCharts> {
  return serverFetch<DashboardCharts>(
    `/manager/dashboard/charts${toQueryString(query)}`,
  );
}

export function getActivity(
  limit = 12,
): Promise<Paginated<ActivityItem>> {
  return serverFetch<Paginated<ActivityItem>>(
    `/manager/dashboard/activity${toQueryString({ limit })}`,
  );
}

export function getSectionView(query: {
  section?: string;
  weekStart?: string;
}): Promise<SectionView> {
  return serverFetch<SectionView>(
    `/manager/dashboard/section${toQueryString(query)}`,
  );
}

export function getUsers(query: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}): Promise<Paginated<ManagedUser>> {
  return serverFetch<Paginated<ManagedUser>>(`/users${toQueryString(query)}`);
}

/** One project including its assigned members. */
export function getProject(id: string): Promise<
  Project & { members: { user: { id: string; name: string; email: string; role: Role } }[] }
> {
  return serverFetch<
    Project & { members: { user: { id: string; name: string; email: string; role: Role } }[] }
  >(`/projects/${id}`);
}

/** Whether the backend has a Gemini key, so the UI can hide the widget. */
export async function getAssistantStatus(): Promise<{ configured: boolean }> {
  try {
    return await serverFetch<{ configured: boolean }>('/manager/assistant/status');
  } catch {
    // Never let a missing/unreachable assistant break the app shell.
    return { configured: false };
  }
}
