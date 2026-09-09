import { NextResponse } from 'next/server';
import { ApiError, apiFetch, type AuthResponse } from '@/lib/api';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

// Exchanges credentials for a cookie.
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  try {
    const { accessToken, user } = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body,
    });

    // Return the user (useful for redirecting) but never the raw token.
    const response = NextResponse.json({ user });

    response.cookies.set({
      name: AUTH_COOKIE,
      value: accessToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, /* Mirrors JWT_EXPIRES_IN=1d. */
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 502 });
  }
}
