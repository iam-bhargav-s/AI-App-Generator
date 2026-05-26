import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { generateSeedData } from '@/lib/appScaffolder';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;
    const app = await dbWrapper.getApp(appId);
    if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

    const appConfig: any = app.config;
    if (!appConfig?.database?.models || appConfig.database.models.length === 0) {
      return NextResponse.json({ success: true, message: 'No models to seed' });
    }

    let seedData = appConfig.prebuiltSeedData;

    if (!seedData) {
      // Fallback to AI generation if not a prebuilt template
      seedData = await generateSeedData(appConfig.database.models, app.name, app.description || '');
    }

    if (seedData) {
      for (const model of appConfig.database.models) {
        if (model.name === 'User' || model.name.includes('Activity') || model.name.includes('Log')) {
          if (!appConfig.prebuiltSeedData) continue; // Only skip if not a prebuilt template (which might want to seed users/logs)
        }
        
        let records = seedData[model.name];
        if (!records) {
          const key = Object.keys(seedData).find(k => k.toLowerCase() === model.name.toLowerCase());
          if (key) records = seedData[key];
        }
        if (!records) {
          const key = Object.keys(seedData).find(k => k.toLowerCase().includes(model.name.toLowerCase().replace(/s$/, '')) || model.name.toLowerCase().includes(k.toLowerCase().replace(/s$/, '')));
          if (key) records = seedData[key];
        }

        if (Array.isArray(records)) {
          for (const recordData of records) {
            await dbWrapper.createRecord(app.id, model.name, recordData);
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Failed to generate seed data' }, { status: 500 });
  } catch (error: any) {
    console.error('Seed API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
