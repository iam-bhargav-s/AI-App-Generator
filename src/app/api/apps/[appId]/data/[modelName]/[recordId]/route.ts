import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getSessionUser } from '@/lib/auth';
import { validateRecord } from '@/lib/validation';
import { triggerWorkflowEvent } from '@/lib/workflowEngine';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; modelName: string; recordId: string }> }
) {
  try {
    const { appId, modelName, recordId } = await params;
    const app = await dbWrapper.getApp(appId);
    
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const appConfig: any = app.config;
    const authEnabled = appConfig?.auth?.enabled || false;

    // Get current record to verify ownership
    const record = await dbWrapper.getRecord(recordId);
    if (!record || record.appId !== appId || record.modelName.toLowerCase() !== modelName.toLowerCase()) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (authEnabled) {
      const session = await getSessionUser(req);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (record.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
      }
    }

    const body = await req.json();

    // Validate update fields against config schema
    const validationResult = await validateRecord(appId, modelName, body, appConfig, recordId);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.errors },
        { status: 400 }
      );
    }

    // Perform database edit
    const updatedRecord = await dbWrapper.updateRecord(recordId, validationResult.sanitizedData);

    const recordData = {
      id: updatedRecord.id,
      ...(updatedRecord.data as any),
      userId: updatedRecord.userId,
      createdAt: updatedRecord.createdAt,
      updatedAt: updatedRecord.updatedAt,
    };

    // Trigger update workflows
    triggerWorkflowEvent('RECORD_UPDATED', modelName, updatedRecord, app);

    return NextResponse.json({ data: recordData, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string; modelName: string; recordId: string }> }
) {
  try {
    const { appId, modelName, recordId } = await params;
    const app = await dbWrapper.getApp(appId);
    
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const appConfig: any = app.config;
    const authEnabled = appConfig?.auth?.enabled || false;

    // Get current record to verify ownership
    const record = await dbWrapper.getRecord(recordId);
    if (!record || record.appId !== appId || record.modelName.toLowerCase() !== modelName.toLowerCase()) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (authEnabled) {
      const session = await getSessionUser(req);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (record.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
      }
    }

    // Perform database delete
    await dbWrapper.deleteRecord(recordId);

    // Trigger delete workflows
    triggerWorkflowEvent('RECORD_DELETED', modelName, record, app);

    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
