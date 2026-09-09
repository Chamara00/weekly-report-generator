import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

// Ends a session the server has already rejected, then sends the user to login.
export function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get('reason') === 'role' ? 'role' : 'expired';
  const response = NextResponse.redirect(new URL(`/login?reason=${reason}`, request.url));
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
