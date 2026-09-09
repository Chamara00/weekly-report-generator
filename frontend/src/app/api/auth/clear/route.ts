import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

/**
 * Ends a session the server has already rejected, then sends the user to login.
 *
 * Why this exists: middleware can only DECODE the cookie (the signing secret
 * lives in the backend), so a token that Nest refuses -- expired, revoked, or
 * belonging to a deleted or deactivated user -- still looks valid to it. The
 * app layout is what discovers the truth, when /auth/me returns 401.
 *
 * A server component cannot delete a cookie while rendering, so it redirects
 * here instead. This handler clears the cookie and forwards to /login, which
 * breaks what would otherwise be an endless bounce:
 *
 *   /dashboard -> (layout: 401) -> /login -> (middleware: cookie decodes) -> /dashboard -> ...
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login?expired=1', request.url));
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
