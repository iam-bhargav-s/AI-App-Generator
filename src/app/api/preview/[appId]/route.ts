import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';

export async function GET(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const { appId } = await params;
    const version = req.nextUrl.searchParams.get('v');

    const app = await dbWrapper.getApp(appId);
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const config = typeof app.config === 'string' ? JSON.parse(app.config) : { ...app.config };

    // If a specific version is requested and we have history, look back for it
    let schemaToReturn = config.database;
    
    if (version && config.history && parseInt(version) < (config.version || 1)) {
      // Versioning heuristic: version 1 is history[0], etc.
      const targetIndex = parseInt(version) - 1;
      if (config.history[targetIndex]) {
        schemaToReturn = config.history[targetIndex];
      }
    }

    return NextResponse.json({ 
      success: true, 
      app: {
        id: app.id,
        name: app.name,
        description: app.description,
        schema: schemaToReturn,
        version: version || config.version || 1
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
