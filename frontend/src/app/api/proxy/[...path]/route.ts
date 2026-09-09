import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

// Authenticated pass-through to the Nest API for CLIENT components.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

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
      { message: 'Something went wrong. Please try again.' },
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
