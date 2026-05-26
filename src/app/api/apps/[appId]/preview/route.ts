import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/auth';

// Helper for generating tokens (nanoid equivalent)
function generateToken(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { appId } = await params;

    const app = await dbWrapper.getApp(appId);
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const token = generateToken(12);
    
    // Freeze current config schema
    const frozenSchema = typeof app.config === 'string' ? JSON.parse(app.config) : app.config;

    await dbWrapper.createSnapshot(appId, token, frozenSchema);

    // Return the specific preview URL
    const previewUrl = `/preview/${token}`;

    return NextResponse.json({ 
      success: true, 
      previewUrl,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });

  } catch (error: any) {
    console.error('Preview Snapshot Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
