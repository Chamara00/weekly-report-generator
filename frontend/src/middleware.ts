import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, decodeToken, homePathForRole } from '@/lib/auth-cookie';

/** Pages reachable without a token. */
const PUBLIC_ROUTES = ['/login', '/register'];

/** Which role owns which section of the app. */
const ROLE_PREFIXES: Record<string, 'MANAGER' | 'TEAM_MEMBER'> = {
  '/manager': 'MANAGER',
  '/dashboard': 'TEAM_MEMBER',
};

/**
 * Page-level routing only -- convenience, not security. The real gate is
 * JwtAuthGuard/RolesGuard in Nest, which verify the signature; this only reads
 * the claims to avoid showing someone a page they cannot use.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const claims = decodeToken(request.cookies.get(AUTH_COOKIE)?.value ?? '');
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Not logged in and asking for a protected page -> /login.
  if (!claims) {
    if (isPublicRoute) return NextResponse.next();

    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const home = homePathForRole(claims.role);

  // Logged in but on /login, /register or / -> straight to their own section.
  if (isPublicRoute || pathname === '/') {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Logged in but in the other role's section -> back to their own.
  const owner = Object.entries(ROLE_PREFIXES).find(([prefix]) =>
    pathname.startsWith(prefix),
  )?.[1];

  if (owner && owner !== claims.role) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, the auth Route Handlers and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
