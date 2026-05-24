import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/auth';
import { scaffoldApp, generateSeedData } from '@/lib/appScaffolder';

const DEFAULT_APP_CONFIG = {
  name: 'New Application',
  description: '',
  auth: {
    enabled: false,
    userModel: 'User',
    roles: ['Admin', 'Member']
  },
  database: {
    models: []
  },
  ui: {
    layout: 'Sidebar',
    pages: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        route: '/dashboard',
        components: [
          {
            id: 'welcome-card',
            type: 'StatsGrid',
            props: {
              items: [
                { label: 'System Status', value: 'Online', change: 'Stable' },
                { label: 'Active Users', value: '1', change: 'Local Session' }
              ]
            }
          }
        ]
      }
    ]
  },
  apis: [],
  workflows: []
};

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await dbWrapper.listApps(user.id);
    return NextResponse.json({ apps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, config } = body;

    if (!name) {
      return NextResponse.json({ error: 'Application name is required' }, { status: 400 });
    }

    let appConfig;
    if (config && Object.keys(config).length > 0) {
      appConfig = {
        ...DEFAULT_APP_CONFIG,
        ...config,
        name: name,
        description: description || config?.description || ''
      };
    } else {
      appConfig = await scaffoldApp(name, description || '');
    }

    const app = await dbWrapper.createApp({
      name,
      description: description || '',
      config: appConfig,
      userId: user.id,
    });

    // Auto-generate seed data if models exist
    if (appConfig.database?.models?.length > 0) {
      try {
        const seedData = await generateSeedData(appConfig.database.models, name, description || config?.description || '');
        if (seedData) {
          console.log(`[Scaffolder] Generated seed data for ${Object.keys(seedData).length} models.`);
          for (const model of appConfig.database.models) {
            if (model.name === 'User' || model.name.includes('Activity') || model.name.includes('Log')) continue;
            
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
        }
      } catch (seedError) {
        console.error('[Scaffolder] Non-fatal error saving seed data:', seedError);
      }
    }

    return NextResponse.json({ app, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

