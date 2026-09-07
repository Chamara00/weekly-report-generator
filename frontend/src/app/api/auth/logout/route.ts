import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

/**
 * Clears the auth cookie.
 *
 * There is nothing to tell Nest about: the JWT is stateless, so "logging out"
 * means deleting the client's copy. The token stays technically valid until it
 * expires, which is the usual trade-off for stateless auth.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
