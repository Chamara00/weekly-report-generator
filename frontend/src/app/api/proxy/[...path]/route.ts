import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

/**
 * Authenticated pass-through to the Nest API for CLIENT components.
 *
 * Why this exists: the token is in an httpOnly cookie, so a browser fetch
 * cannot attach it as a Bearer header, and Nest's JwtStrategy only reads that
 * header. This handler runs on the server, where the cookie is readable, and
 * forwards the request with the header attached.
 *
 * It is a dumb pipe on purpose -- no business logic, no reshaping. Status codes
 * and error bodies come back exactly as Nest produced them, so a form can map
 * a 400's field messages without this layer needing to know about them.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function forward(request: NextRequest, path: string[]) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const search = request.nextUrl.search;
  const body =
    request.method === 'GET' || request.method === 'DELETE'
      ? undefined
      : await request.text();

  try {
    const response = await fetch(`${API_URL}/${path.join('/')}${search}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
      cache: 'no-store',
    });

    const payload = await response.text();

    return new NextResponse(payload, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach the API. Is the backend running?' },
      { status: 502 },
    );
  }
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Context) {
  return forward(request, (await ctx.params).path);
}

export async function POST(request: NextRequest, ctx: Context) {
  return forward(request, (await ctx.params).path);
}

export async function PATCH(request: NextRequest, ctx: Context) {
  return forward(request, (await ctx.params).path);
}

export async function DELETE(request: NextRequest, ctx: Context) {
  return forward(request, (await ctx.params).path);
}
