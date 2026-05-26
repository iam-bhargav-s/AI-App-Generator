import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { hashPassword, generateToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await dbWrapper.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await dbWrapper.createUser({
      email,
      password: hashedPassword,
      name,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      success: true
    });

    const isSecure = req.nextUrl.protocol === 'https:' && !req.nextUrl.hostname.includes('localhost') && !req.nextUrl.hostname.includes('127.0.0.1');
    response.headers.set('Set-Cookie', setSessionCookie(token, isSecure));
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
