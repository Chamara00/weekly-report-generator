// Thin typed wrapper around fetch for talking to the NestJS API.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type Role = 'TEAM_MEMBER' | 'MANAGER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// An error carrying the HTTP status, so callers can branch on 401 vs 409.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  // Bearer token, for server-side calls that read it from the cookie.
  token?: string;
}

// Nest's exception filter returns { message: string | string[] }.
function extractMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const { message } = payload as { message: unknown };
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(
  path: string,
  { body, token, headers, ...init }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    // Send cookies on cross-origin requests; Nest allows this via CORS credentials: true.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(payload, response.status));
  }

  return payload as T;
}
