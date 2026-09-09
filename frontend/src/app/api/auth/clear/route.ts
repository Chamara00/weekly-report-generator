import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

// Ends a session the server has already rejected, then sends the user to login.
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login?expired=1', request.url));
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
