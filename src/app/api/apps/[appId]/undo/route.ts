import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { appId } = await params;
    const app = await dbWrapper.getApp(appId);
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const config = typeof app.config === 'string' ? JSON.parse(app.config) : { ...app.config };
    
    if (!config.history || config.history.length === 0) {
      return NextResponse.json({ error: 'No history to undo' }, { status: 400 });
    }

    // Pop the last snapshot from history
    const previousState = config.history.pop();
    
    // Apply previous database schema state
    config.database = previousState;
    config.version = (config.version || 1) + 1;
    
    if (!config.editHistory) config.editHistory = [];
    config.editHistory.push({
      id: Date.now(),
      text: 'Reverted to previous schema snapshot',
      status: 'success',
      timestamp: new Date().toISOString()
    });

    const updatedApp = await dbWrapper.updateApp(appId, { config });

    return NextResponse.json({ 
      success: true, 
      app: updatedApp
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
