import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/auth';
import { editAppSchema } from '@/lib/gemini';

export async function POST(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { instruction } = body;
    const { appId } = await params;

    if (!instruction) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
    }

    const app = await dbWrapper.getApp(appId);
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const config = typeof app.config === 'string' ? JSON.parse(app.config) : { ...app.config };
    
    // Preserve History for Undo
    if (!config.history) config.history = [];
    config.history.push(JSON.parse(JSON.stringify(config.database))); // Snapshot DB state before mutation

    // Use Gemini to Edit Schema
    const updatedDatabase = await editAppSchema(config, instruction);
    
    if (updatedDatabase?.error) {
      return NextResponse.json({ 
        error: `AI Error: ${updatedDatabase.error}` 
      }, { status: 500 });
    }

    if (!updatedDatabase || !updatedDatabase.success) {
      return NextResponse.json({ 
        error: 'Failed to process edit instruction with AI.' 
      }, { status: 500 });
    }

    // Apply Mutation (handle if the AI nested it in a database key)
    const finalDb = updatedDatabase.data.database ? updatedDatabase.data.database : updatedDatabase.data;
    config.database = finalDb;

    // Bump Version and Log
    config.version = (config.version || 1) + 1;
    if (!config.editHistory) config.editHistory = [];
    config.editHistory.push({
      id: Date.now(),
      text: instruction,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    // Save to DB
    const updatedApp = await dbWrapper.updateApp(appId, { config });

    return NextResponse.json({ 
      success: true, 
      app: updatedApp
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
