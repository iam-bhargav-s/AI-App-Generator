import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db'; // Ensure prisma client is exported from here

export async function GET(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { appId } = await params;
    
    // Get modelName query param to filter records
    const modelName = req.nextUrl.searchParams.get('modelName');
    
    if (!modelName) {
      return NextResponse.json({ error: 'modelName query parameter is required' }, { status: 400 });
    }

    // Verify app ownership
    const app = await dbWrapper.getApp(appId);
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const records = await db.record.findMany({
      where: {
        appId: appId,
        modelName: modelName
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { appId } = await params;
    const body = await req.json();
    const { modelName, data } = body;

    if (!modelName || !data) {
      return NextResponse.json({ error: 'modelName and data are required' }, { status: 400 });
    }

    // Verify app ownership
    const app = await dbWrapper.getApp(appId);
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const record = await db.record.create({
      data: {
        appId,
        modelName,
        data,
        userId: user.id // optional, depending on if records are scoped to creator in builder
      }
    });

    return NextResponse.json({ record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
