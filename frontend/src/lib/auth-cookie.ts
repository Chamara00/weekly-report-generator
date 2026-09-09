import type { Role } from './api';

// Name of the httpOnly cookie holding the access token.
export const AUTH_COOKIE = 'access_token';

export interface TokenClaims {
  sub: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
}

// Reads the claims out of a JWT WITHOUT verifying the signature.
export function decodeToken(token: string): TokenClaims | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as TokenClaims;

    // Treat an expired token as no token at all.
    if (typeof claims.exp === 'number' && claims.exp * 1000 < Date.now()) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

// Where a user of this role belongs after logging in.
export function homePathForRole(role: Role): string {
  return role === 'MANAGER' ? '/manager' : '/dashboard';
}
