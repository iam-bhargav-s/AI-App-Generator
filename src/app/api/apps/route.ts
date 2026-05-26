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
      let aiSchema = await generateAppSchema(description || name);

      // If AI generation fails or returns invalid schema, run the local fallback.
      if (!aiSchema || !aiSchema.database || !Array.isArray(aiSchema.database.models) || aiSchema.database.models.length === 0) {
        console.warn('AI schema generation failed or returned invalid data. Falling back to local schema generator...');
        let localConfig;

        try {
          localConfig = await scaffoldApp(name, description || name);
        } catch (fallbackErr) {
          console.error('Local schema fallback failed:', fallbackErr);
          localConfig = undefined;
        }

        const fallbackModels = Array.isArray(localConfig?.database?.models) && localConfig.database.models.length > 0
          ? localConfig.database.models
          : [
              {
                name: 'Item',
                fields: [
                  { name: 'name', type: 'String' },
                  { name: 'description', type: 'String' }
                ]
              }
            ];

        aiSchema = {
          database: { models: fallbackModels },
          expandedDescription: `[Local Fallback] ${localConfig?.description || 'Generated locally from your request.'}`,
          prebuiltSeedData: generateLocalMockData(fallbackModels)
        };
      }

      if (!aiSchema || !aiSchema.database || !Array.isArray(aiSchema.database.models) || aiSchema.database.models.length === 0) {
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

function generateLocalMockData(models: any[]): Record<string, any[]> {
  const seedData: Record<string, any[]> = {};
  
  for (const model of models) {
    const records: any[] = [];
    
    for (let i = 1; i <= 8; i++) {
      const record: any = {};
      
      for (const field of model.fields) {
        if (field.name === 'id') continue;
        
        const fNameLower = field.name.toLowerCase();
        
        if (field.type === 'String') {
          // Generate realistic strings based on field names
          if (fNameLower.includes('email')) {
            record[field.name] = `user${i}@example.com`;
          } else if (fNameLower.includes('name') || fNameLower.includes('first') || fNameLower.includes('last')) {
            const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona', 'George', 'Hannah'];
            const lastNames = ['Smith', 'Doe', 'Johnson', 'Brown', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson'];
            if (fNameLower.includes('first')) {
              record[field.name] = firstNames[i % firstNames.length];
            } else if (fNameLower.includes('last')) {
              record[field.name] = lastNames[i % lastNames.length];
            } else {
              record[field.name] = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
            }
          } else if (fNameLower.includes('phone') || fNameLower.includes('tel') || fNameLower.includes('contact')) {
            record[field.name] = `555-010${i}`;
          } else if (fNameLower.includes('address') || fNameLower.includes('location') || fNameLower.includes('city') || fNameLower.includes('state')) {
            const cities = ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle', 'Boston', 'Denver', 'Miami'];
            const states = ['NY', 'CA', 'IL', 'TX', 'WA', 'MA', 'CO', 'FL'];
            if (fNameLower.includes('city')) {
              record[field.name] = cities[i % cities.length];
            } else if (fNameLower.includes('state')) {
              record[field.name] = states[i % states.length];
            } else {
              record[field.name] = `${100 * i} Main St, ${cities[i % cities.length]}, ${states[i % states.length]}`;
            }
          } else if (fNameLower.includes('company') || fNameLower.includes('supplier') || fNameLower.includes('client')) {
            const companies = ['Acme Corp', 'BuildIt LLC', 'Silent Films', 'Themyscira Inc', 'Wright Aviation', 'Global Logistics', 'Apex Systems', 'Innovate LLC'];
            record[field.name] = companies[i % companies.length];
          } else if (fNameLower.includes('title') || fNameLower.includes('subject') || fNameLower.includes('theme')) {
            record[field.name] = `Sample ${model.name} Title ${i}`;
          } else if (fNameLower.includes('status') || fNameLower.includes('stage')) {
            const statuses = ['Pending', 'Completed', 'Approved', 'Cancelled', 'In Progress', 'Active'];
            record[field.name] = statuses[i % statuses.length];
          } else if (fNameLower.includes('sku') || fNameLower.includes('code') || fNameLower.includes('serial')) {
            record[field.name] = `SKU-00${i}`;
          } else if (fNameLower.includes('description') || fNameLower.includes('note') || fNameLower.includes('detail')) {
            record[field.name] = `This is a sample description for ${model.name} record number ${i}.`;
          } else if (fNameLower.includes('category') || fNameLower.includes('type') || fNameLower.includes('genre')) {
            const categories = ['General', 'Premium', 'Standard', 'Support', 'Feedback', 'Other'];
            record[field.name] = categories[i % categories.length];
          } else {
            record[field.name] = `Sample ${field.name} ${i}`;
          }
        } else if (field.type === 'Int' || field.type === 'Float') {
          // Generate realistic numbers
          if (fNameLower.includes('price') || fNameLower.includes('amount') || fNameLower.includes('cost') || fNameLower.includes('value')) {
            record[field.name] = Math.floor(10 + Math.random() * 200);
          } else if (fNameLower.includes('stock') || fNameLower.includes('quantity') || fNameLower.includes('count')) {
            record[field.name] = Math.floor(5 + Math.random() * 150);
          } else if (fNameLower.includes('age')) {
            record[field.name] = 20 + (i * 3) % 45;
          } else {
            record[field.name] = i * 10;
          }
        } else if (field.type === 'Boolean') {
          record[field.name] = i % 2 === 0;
        } else if (field.type === 'DateTime') {
          const date = new Date();
          date.setDate(date.getDate() - i);
          record[field.name] = date.toISOString();
        } else {
          record[field.name] = `Value ${i}`;
        }
      }
      records.push(record);
    }
    seedData[model.name] = records;
  }
  return seedData;
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

