import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { dbWrapper } from './dbWrapper';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me-12345';
const COOKIE_NAME = 'auth_session';

export interface UserSession {
  userId: string;
  email: string;
  name?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return null;
  
  try {
    return await dbWrapper.findUserById(session.userId);
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(token: string, isSecure: boolean = false): string {
  // Return cookie string header
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isSecure ? '; Secure' : ''}`;
}

export function clearSessionCookie(isSecure: boolean = false): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`;
}
