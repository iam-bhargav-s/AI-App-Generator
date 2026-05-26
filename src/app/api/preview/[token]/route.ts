import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 });

    const snapshot = await dbWrapper.getSnapshot(token);
    
    if (!snapshot) {
      return NextResponse.json({ error: 'Preview link expired or invalid' }, { status: 404 });
    }

    // Return frozen schema
    const schema = typeof snapshot.schema === 'string' ? JSON.parse(snapshot.schema) : snapshot.schema;

    return NextResponse.json({ 
      success: true, 
      appId: snapshot.appId,
      schema,
      createdAt: snapshot.createdAt
    });

  } catch (error: any) {
    console.error('Fetch Preview Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
