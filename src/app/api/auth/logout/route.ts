import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const isSecure = req.nextUrl.protocol === 'https:' && !req.nextUrl.hostname.includes('localhost') && !req.nextUrl.hostname.includes('127.0.0.1');
  response.headers.set('Set-Cookie', clearSessionCookie(isSecure));
  return response;
}
