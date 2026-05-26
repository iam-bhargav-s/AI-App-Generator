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

import { generateAppSchema } from '@/lib/gemini';

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
      // Use Real Gemini AI Generation
      const aiSchema = await generateAppSchema(description || name);
      
      if (!aiSchema) {
        return NextResponse.json({ 
          error: 'Failed to generate application schema with AI. Please try again.',
        }, { status: 500 });
      }
      
      appConfig = {
        ...DEFAULT_APP_CONFIG,
        ...aiSchema,
        name: name,
        description: description || ''
      };
    }

    const app = await dbWrapper.createApp({
      name,
      description: description || '',
      config: appConfig,
      userId: user.id,
    });

    // Auto-generate seed data happens client-side now to prevent Vercel 10s timeouts

    return NextResponse.json({ app, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

