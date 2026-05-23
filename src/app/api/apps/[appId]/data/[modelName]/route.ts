import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getSessionUser } from '@/lib/auth';
import { validateRecord } from '@/lib/validation';
import { triggerWorkflowEvent } from '@/lib/workflowEngine';

// GET: Query all records of a specific model, with user-scoped scoping if auth is enabled in configuration
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; modelName: string }> }
) {
  try {
    const { appId, modelName } = await params;
    const app = await dbWrapper.getApp(appId);
    
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const appConfig: any = app.config;
    const authEnabled = appConfig?.auth?.enabled || false;
    let userScopeId: string | null = null;

    if (authEnabled) {
      const session = await getSessionUser(req);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
      }
      userScopeId = session.userId;
    }

    // Read records matching appId and model
    const records = await dbWrapper.getRecords(appId, modelName, {
      userId: authEnabled ? userScopeId : undefined,
    });

    // Unpack data from JSONB
    const formattedRecords = records.map((rec: any) => ({
      id: rec.id,
      ...(rec.data as any),
      userId: rec.userId,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }));

    return NextResponse.json({ data: formattedRecords });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new record and fire RECORD_CREATED workflow triggers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; modelName: string }> }
) {
  try {
    const { appId, modelName } = await params;
    const app = await dbWrapper.getApp(appId);
    
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const appConfig: any = app.config;
    const authEnabled = appConfig?.auth?.enabled || false;
    let creatorUserId: string | null = null;

    if (authEnabled) {
      const session = await getSessionUser(req);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
      }
      creatorUserId = session.userId;
    }

    const body = await req.json();
    
    // Validate record against configuration schema
    const validationResult = await validateRecord(appId, modelName, body, appConfig);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.errors },
        { status: 400 }
      );
    }

    // Save record to DB
    const record = await dbWrapper.createRecord(
      appId,
      modelName,
      validationResult.sanitizedData,
      creatorUserId
    );

    const recordData = {
      id: record.id,
      ...(record.data as any),
      userId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    // Trigger workflows asynchronously
    triggerWorkflowEvent('RECORD_CREATED', modelName, record, app);

    return NextResponse.json({ data: recordData, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
