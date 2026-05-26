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

import { generateAppSchema, expandUserPrompt } from '@/lib/gemini';

import fs from 'fs';
import path from 'path';

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
    
    // Check if it matches a predefined template
    let templateFile = null;
    const normalized = name.toLowerCase().trim();
    if (normalized.includes('crm') || normalized.includes('sales') || normalized.includes('pipeline') || normalized.includes('starter')) {
      templateFile = 'crm-workspace.json';
    } else if (normalized.includes('hr') || normalized.includes('people') || normalized.includes('employee')) {
      templateFile = 'hr-dashboard.json';
    } else if (normalized.includes('inventory') || normalized.includes('stock') || normalized.includes('warehouse')) {
      templateFile = 'inventory-system.json';
    } else if (normalized.includes('analytics') || normalized.includes('kpi') || normalized.includes('metric')) {
      templateFile = 'analytics-workspace.json';
    } else if (normalized.includes('admin') || normalized.includes('control')) {
      templateFile = 'admin-panel.json';
    } else {
      const slug = normalized.replace(/\s+/g, '-');
      templateFile = `${slug}.json`;
    }

    const templatePath = path.join(process.cwd(), 'src', 'templates', templateFile);
    let isTemplate = false;

    if (fs.existsSync(templatePath)) {
      const templateData = fs.readFileSync(templatePath, 'utf8');
      const parsedTemplate = JSON.parse(templateData);
      appConfig = {
        ...DEFAULT_APP_CONFIG,
        ...parsedTemplate,
        name: parsedTemplate.name,
        description: parsedTemplate.description
      };
      isTemplate = true;
    } else if (config && Object.keys(config).length > 0) {
      appConfig = {
        ...DEFAULT_APP_CONFIG,
        ...config,
        name: name,
        description: description || config?.description || ''
      };
    } else {
      // Use Real Gemini AI Generation (combining specification expansion + schema + mock data)
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
        description: aiSchema.expandedDescription || description || ''
      };
    }

    const app = await dbWrapper.createApp({
      name: isTemplate ? appConfig.name : name,
      description: isTemplate ? appConfig.description : (appConfig.description || description || ''),
      config: appConfig,
      userId: user.id,
    });

    // Auto-generate seed data immediately if prebuiltSeedData is provided to prevent Vercel 10s timeouts
    if (appConfig.prebuiltSeedData) {
      try {
        const recordsToInsert: { modelName: string; data: any; userId?: string | null }[] = [];
        for (const model of appConfig.database.models) {
          let records = appConfig.prebuiltSeedData[model.name];
          if (!records) {
            const key = Object.keys(appConfig.prebuiltSeedData).find(k => k.toLowerCase() === model.name.toLowerCase());
            if (key) records = appConfig.prebuiltSeedData[key];
          }
          if (!records) {
            const key = Object.keys(appConfig.prebuiltSeedData).find(k => k.toLowerCase().includes(model.name.toLowerCase().replace(/s$/, '')) || model.name.toLowerCase().includes(k.toLowerCase().replace(/s$/, '')));
            if (key) records = appConfig.prebuiltSeedData[key];
          }
          if (Array.isArray(records)) {
            for (const recordData of records) {
              recordsToInsert.push({
                modelName: model.name,
                data: recordData,
                userId: user.id
              });
            }
          }
        }
        if (recordsToInsert.length > 0) {
          await dbWrapper.createRecords(app.id, recordsToInsert);
        }
      } catch (seedErr) {
        console.error('Direct seeding failed:', seedErr);
      }
    }

    return NextResponse.json({ app, success: true, seeded: !!appConfig.prebuiltSeedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

