'use client';

import { ApiError } from './api';
import type { Project, ReportDetail, ReportPayload } from './types';

/**
 * Client-side mutations, routed through /api/proxy so the httpOnly cookie can
 * be turned into a Bearer header on the server.
 *
 * Errors are rethrown as ApiError carrying the backend's status and message,
 * including class-validator's per-field list, which the forms map to inputs.
 */

export interface FieldErrors {
  [field: string]: string;
}

/** Nest returns validation failures as ["tasks.0.name should not be empty", ...]. */
export function toFieldErrors(messages: string[]): FieldErrors {
  const errors: FieldErrors = {};

  for (const message of messages) {
    const field = message.split(' ')[0];
    if (field && !errors[field]) {
      errors[field] = message;
    }
  }

  return errors;
}

export class ValidationError extends ApiError {
  constructor(
    readonly messages: string[],
    message: string,
  ) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

async function proxy<T>(
  path: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const { body, ...rest } = init;

  const response = await fetch(`/api/proxy${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...rest.headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const raw = (payload as { message?: string | string[] } | null)?.message;

    if (Array.isArray(raw)) {
      throw new ValidationError(raw, raw.join(', '));
    }

    throw new ApiError(response.status, raw ?? `Request failed (${response.status})`);
  }

  return payload as T;
}

export function createReport(payload: ReportPayload): Promise<ReportDetail> {
  return proxy<ReportDetail>('/reports', { method: 'POST', body: payload });
}

export function updateReport(id: string, payload: ReportPayload): Promise<ReportDetail> {
  return proxy<ReportDetail>(`/reports/${id}`, { method: 'PATCH', body: payload });
}

export function submitReport(id: string): Promise<ReportDetail> {
  return proxy<ReportDetail>(`/reports/${id}/submit`, { method: 'POST' });
}

export { ApiError };

// ---------------------------------------------------------------------------
// Manager mutations
// ---------------------------------------------------------------------------

export function reviewReport(
  id: string,
  body: { action: 'APPROVE' | 'REQUEST_CHANGES'; comment?: string },
): Promise<ReportDetail> {
  return proxy<ReportDetail>(`/manager/reports/${id}/review`, {
    method: 'POST',
    body,
  });
}

export function createProject(body: {
  name: string;
  description?: string;
}): Promise<Project> {
  return proxy<Project>('/projects', { method: 'POST', body });
}

export function updateProject(
  id: string,
  body: { name?: string; description?: string },
): Promise<Project> {
  return proxy<Project>(`/projects/${id}`, { method: 'PATCH', body });
}

export function deleteProject(id: string): Promise<{ id: string; deleted: boolean }> {
  return proxy<{ id: string; deleted: boolean }>(`/projects/${id}`, {
    method: 'DELETE',
  });
}
