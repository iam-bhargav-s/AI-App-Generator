import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getSessionUser } from '@/lib/auth';
import { validateRecord } from '@/lib/validation';
import { triggerWorkflowEvent } from '@/lib/workflowEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;
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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      creatorUserId = session.userId;
    }

    const body = await req.json();
    const { modelName, mappings, data: rows } = body;

    if (!modelName || !mappings || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Missing modelName, mappings, or rows data' },
        { status: 400 }
      );
    }

    const importErrors: { rowIndex: number; rowData: any; errors: any[] }[] = [];
    const importedRecords: any[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const mappedRow: any = {};

      // Map raw CSV row fields to schema field names based on mapping config
      for (const [csvHeader, schemaFieldName] of Object.entries(mappings)) {
        if (schemaFieldName) {
          mappedRow[schemaFieldName as string] = rawRow[csvHeader];
        }
      }

      // Validate the mapped row
      const validationResult = await validateRecord(
        appId,
        modelName,
        mappedRow,
        appConfig
      );

      if (!validationResult.isValid) {
        importErrors.push({
          rowIndex: i + 1,
          rowData: rawRow,
          errors: validationResult.errors,
        });
        continue;
      }

      try {
        // Create the record
        const record = await dbWrapper.createRecord(
          appId,
          modelName,
          validationResult.sanitizedData,
          creatorUserId
        );

        importedRecords.push(record);

        // Async trigger RECORD_CREATED workflows
        triggerWorkflowEvent('RECORD_CREATED', modelName, record, app);
      } catch (insertErr: any) {
        importErrors.push({
          rowIndex: i + 1,
          rowData: rawRow,
          errors: [{ field: 'database', message: insertErr.message || 'Database insert failed' }],
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalCount: rows.length,
      importedCount: importedRecords.length,
      failedCount: importErrors.length,
      errors: importErrors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
