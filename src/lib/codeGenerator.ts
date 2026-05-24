export interface GeneratedFile {
  path: string;
  content: string;
}

function toFriendlyHeader(col: string) {
  if (!col) return '';
  const spaced = col.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function generateCodebase(appConfig: any): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const appName = appConfig.name || 'Generated App';
  const models = appConfig.database?.models || [];
  const pages = appConfig.ui?.pages || [];
  const workflows = appConfig.workflows || [];
  const authEnabled = appConfig.auth?.enabled || false;

  // 1. package.json
  files.push({
    path: 'package.json',
    content: JSON.stringify({
      name: appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'prisma:generate': 'prisma generate',
        'prisma:push': 'prisma db push'
      },
      dependencies: {
        next: '^14.2.5',
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        '@prisma/client': '^5.18.0',
        bcryptjs: '^2.4.3',
        jsonwebtoken: '^9.0.2',
        'lucide-react': '^0.428.0'
      },
      devDependencies: {
        typescript: '^5.5.4',
        '@types/node': '^20.14.15',
        '@types/react': '^18.3.3',
        '@types/react-dom': '^18.3.0',
        '@types/bcryptjs': '^2.4.6',
        '@types/jsonwebtoken': '^9.0.6',
        postcss: '^8.4.41',
        tailwindcss: '^3.4.10',
        autoprefixer: '^10.4.20',
        prisma: '^5.18.0',
        eslint: '^8.57.0',
        'eslint-config-next': '^14.2.5'
      }
    }, null, 2)
  });

  // 2. tsconfig.json
  files.push({
    path: 'tsconfig.json',
    content: JSON.stringify({
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    }, null, 2)
  });

  // 3. postcss.config.mjs
  files.push({
    path: 'postcss.config.mjs',
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`
  });

  // 4. tailwind.config.ts
  files.push({
    path: 'tailwind.config.ts',
    content: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      }
    },
  },
  plugins: [],
};
export default config;
`
  });

  // 5. next.config.mjs
  files.push({
    path: 'next.config.mjs',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`
  });

  // 6. prisma/schema.prisma
  let prismaSchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
`;

  // Add relations back to models if auth is enabled
  for (const model of models) {
    prismaSchema += `  ${model.name.toLowerCase()}s ${model.name}[]\n`;
  }
  prismaSchema += `}\n\n`;

  // Append customized dynamic models
  for (const model of models) {
    prismaSchema += `model ${model.name} {\n`;
    prismaSchema += `  id        String   @id @default(uuid())\n`;
    
    for (const field of model.fields) {
      let fieldType = field.type;
      if (fieldType === 'DateTime') fieldType = 'DateTime';
      
      const requiredMarker = field.required ? '' : '?';
      const uniqueMarker = field.unique ? ' @unique' : '';
      
      let defaultMarker = '';
      if (field.defaultValue !== undefined && field.defaultValue !== '') {
        if (field.type === 'String') {
          defaultMarker = ` @default("${field.defaultValue}")`;
        } else if (field.type === 'Boolean') {
          defaultMarker = ` @default(${field.defaultValue})`;
        } else if (field.type === 'Int' || field.type === 'Float') {
          defaultMarker = ` @default(${field.defaultValue})`;
        }
      }

      prismaSchema += `  ${field.name} ${fieldType}${requiredMarker}${uniqueMarker}${defaultMarker}\n`;
    }

    prismaSchema += `  userId    String?\n`;
    prismaSchema += `  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)\n`;
    prismaSchema += `  createdAt DateTime @default(now())\n`;
    prismaSchema += `  updatedAt DateTime @updatedAt\n`;
    prismaSchema += `}\n\n`;
  }

  files.push({
    path: 'prisma/schema.prisma',
    content: prismaSchema
  });

  // 7. env file template
  files.push({
    path: '.env.example',
    content: `DATABASE_URL="postgresql://postgres:password@localhost:5432/app_db?schema=public"\nJWT_SECRET="generate-a-secure-secret-key-here"\n`
  });

  // 8. src/lib/db.ts
  files.push({
    path: 'src/lib/db.ts',
    content: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
`
  });

  // 9. src/lib/auth.ts
  files.push({
    path: 'src/lib/auth.ts',
    content: `import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-deployment';
const COOKIE_NAME = 'app_session';

export interface UserSession {
  userId: string;
  email: string;
  name?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return null;
  
  try {
    return await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true }
    });
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  return \`\${COOKIE_NAME}=\${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=\${7 * 24 * 60 * 60}\${isProd ? '; Secure' : ''}\`;
}

export function clearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return \`\${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0\${isProd ? '; Secure' : ''}\`;
}
`
  });

  // 10. src/app/globals.css
  files.push({
    path: 'src/app/globals.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-zinc-50 text-zinc-900 min-h-screen antialiased;
}
`
  });

  // 11. src/app/layout.tsx
  files.push({
    path: 'src/app/layout.tsx',
    content: `import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${appName}',
  description: '${appConfig.description || 'Generated by application builder runtime.'}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-900 text-white min-h-screen">{children}</body>
    </html>
  );
}
`
  });

  // 12. Create API routes for each model
  for (const model of models) {
    const nameLower = model.name.toLowerCase();
    
    // GET & POST endpoint
    files.push({
      path: `src/app/api/${nameLower}/route.ts`,
      content: `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    ${authEnabled ? `
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const records = await db.${nameLower}.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' }
    });
    ` : `
    const records = await db.${nameLower}.findMany({
      orderBy: { createdAt: 'desc' }
    });
    `}
    return NextResponse.json({ data: records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ${authEnabled ? `
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    ` : ''}
    const body = await req.json();

    // Field casting/validation
    const data: any = {};
    ${model.fields.map((f: any) => {
      let parser = '';
      if (f.type === 'Int') parser = 'parseInt(body.' + f.name + ', 10)';
      else if (f.type === 'Float') parser = 'parseFloat(body.' + f.name + ')';
      else if (f.type === 'Boolean') parser = 'body.' + f.name + ' === true || body.' + f.name + ' === "true"';
      else parser = 'body.' + f.name;

      return `if (body.${f.name} !== undefined) {
      data.${f.name} = ${parser};
    } else if (${f.required}) {
      return NextResponse.json({ error: "Field '${f.name}' is required" }, { status: 400 });
    }`;
    }).join('\n    ')}

    const record = await db.${nameLower}.create({
      data: {
        ...data,
        ${authEnabled ? `userId: session.userId` : ''}
      }
    });

    // Workflows triggers (e.g. Webhooks)
    ${workflows.filter((w: any) => w.trigger?.event === 'RECORD_CREATED' && w.trigger?.model?.toLowerCase() === nameLower).map((w: any) => {
      return w.actions.filter((act: any) => act.type === 'SEND_WEBHOOK').map((act: any) => {
        return `
        // Run webhook trigger async
        fetch("${act.config.url}", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(${JSON.stringify(act.config.payload || {})}.replace(/\\{\\{([^}]+)\\}\\}/g, (_, key) => record[key.trim()] || ''))
        }).catch(err => console.error("Webhook failed", err));
        `;
      }).join('\n');
    }).join('\n')}

    return NextResponse.json({ data: record, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`
    });

    // PUT & DELETE endpoint
    files.push({
      path: `src/app/api/${nameLower}/[id]/route.ts`,
      content: `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ${authEnabled ? `
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const record = await db.${nameLower}.findFirst({
      where: { id: params.id, userId: session.userId }
    });
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    ` : `
    const record = await db.${nameLower}.findFirst({
      where: { id: params.id }
    });
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    `}

    const body = await req.json();
    const data: any = {};
    ${model.fields.map((f: any) => {
      let parser = '';
      if (f.type === 'Int') parser = 'parseInt(body.' + f.name + ', 10)';
      else if (f.type === 'Float') parser = 'parseFloat(body.' + f.name + ')';
      else if (f.type === 'Boolean') parser = 'body.' + f.name + ' === true || body.' + f.name + ' === "true"';
      else parser = 'body.' + f.name;

      return `if (body.${f.name} !== undefined) data.${f.name} = ${parser};`;
    }).join('\n    ')}

    const updated = await db.${nameLower}.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json({ data: updated, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ${authEnabled ? `
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const record = await db.${nameLower}.findFirst({
      where: { id: params.id, userId: session.userId }
    });
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    ` : `
    const record = await db.${nameLower}.findFirst({
      where: { id: params.id }
    });
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    `}

    await db.${nameLower}.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'Record deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`
    });
  }

  // 13. Auth API routes for generated app
  if (authEnabled) {
    files.push({
      path: 'src/app/api/auth/register/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: { email, password: hashedPassword, name }
    });
    
    const token = generateToken({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    res.headers.set('Set-Cookie', setSessionCookie(token));
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`
    });

    files.push({
      path: 'src/app/api/auth/login/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, generateToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    
    const valid = await comparePassword(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    
    const token = generateToken({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    res.headers.set('Set-Cookie', setSessionCookie(token));
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`
    });

    files.push({
      path: 'src/app/api/auth/logout/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}
`
    });

    files.push({
      path: 'src/app/api/auth/me/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user });
}
`
    });
  }

  // 14. Create React Pages under src/app/(app)/[pageId]/page.tsx
  // We'll generate real, standalone pages with layouts and widgets!
  for (const page of pages) {
    const pageId = page.id;
    const components = page.components || [];

    const hasDataTable = components.some((c: any) => c.type === 'DataTable');
    const tableComp = components.find((c: any) => c.type === 'DataTable');
    
    const hasForm = components.some((c: any) => c.type === 'Form');
    const formComp = components.find((c: any) => c.type === 'Form');
    const formModel = formComp?.props?.model;
    
    const hasCalculator = components.some((c: any) => c.type === 'Calculator');
    const hasKanban = components.some((c: any) => c.type === 'Kanban');
    const hasCalendar = components.some((c: any) => c.type === 'Calendar');
    const hasChart = components.some((c: any) => c.type === 'Chart');
    const hasChecklist = components.some((c: any) => c.type === 'Checklist');
    const hasNotes = components.some((c: any) => c.type === 'Notes');
    const hasWizardForm = components.some((c: any) => c.type === 'WizardForm');
    const hasGalleryGrid = components.some((c: any) => c.type === 'GalleryGrid');
    const hasFeed = components.some((c: any) => c.type === 'Feed');
    const hasDetailView = components.some((c: any) => c.type === 'DetailView');

    const activePageModelName = tableComp?.props?.model || formComp?.props?.model || components.find((c: any) => c.props?.model)?.props?.model || '';
    const tableModel = activePageModelName;
    const tableModelFields = models.find((m: any) => m.name === tableModel)?.fields || [];

    let targetModelPath = tableModel ? tableModel.toLowerCase() : '';

    let componentsJsx = '';
    let imports = `import React, { useEffect, useState } from 'react';

function formatHeader(col: string) {
  if (!col) return '';
  const spaced = col.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
`;
    
    // Scan components to inject correct elements
    for (const comp of components) {
      if (comp.type === 'StatsGrid') {
        const items = comp.props?.items || [];
        componentsJsx += `
        {/* Stats Grid Widget */}
        <div className="grid grid-cols-1 md:grid-cols-${Math.min(items.length, 4)} gap-6 mb-8">
          ${items.map((it: any) => `
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 shadow-xl backdrop-blur-sm hover:border-zinc-800 transition duration-150">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">${it.label.replace(/^["']|["']$/g, '')}</p>
            <p className="text-3xl font-black mt-2 text-white tracking-tight">${it.value}</p>
            <span className="text-emerald-400 text-xs font-bold mt-1.5 inline-block bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">${it.change}</span>
          </div>
          `).join('')}
        </div>
        `;
      } else if (comp.type === 'DataTable') {
        const model = comp.props?.model;
        const columns = comp.props?.columns || [];
        const actions = comp.props?.actions || [];
        const nameLower = model?.toLowerCase();

        if (model) {
          componentsJsx += `
        {/* Data Table Widget: ${model} */}
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden mb-8 backdrop-blur-sm">
          <div className="p-6 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">${model} Records</h3>
              <p className="text-xs text-zinc-555 mt-0.5">Manage and browse your ${nameLower} database.</p>
            </div>
            ${(!actions.length || actions.includes('create')) ? `
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 shadow shadow-emerald-950/25"
            >
              + Add ${model}
            </button>
            ` : ''}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/60 text-zinc-400 text-[10px] tracking-wider uppercase font-semibold border-b border-zinc-800/80">
                  ${columns.map((col: string) => `<th className="px-6 py-4">${col}</th>`).join('\n                  ')}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/50 text-xs font-semibold">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={${columns.length + 1}} className="text-center py-10 text-zinc-500 italic">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  records.map((row: any) => (
                    <tr key={row.id} className="hover:bg-zinc-800/30 text-zinc-200 border-b border-zinc-850/40 transition">
                      ${columns.map((col: string) => `<td className="px-6 py-4">{String(row.${col} || '')}</td>`).join('\n                      ')}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditData(row);
                            setShowEditModal(true);
                          }}
                          className="text-xs bg-zinc-850 hover:bg-zinc-800 border border-zinc-800/60 text-zinc-300 hover:text-emerald-400 font-bold px-2.5 py-1.5 rounded-xl transition mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if(confirm("Delete this record?")) {
                              await fetch(\`/api/${nameLower}/\${row.id}\`, { method: "DELETE" });
                              fetchRecords();
                            }
                          }}
                          className="text-xs bg-zinc-850 hover:bg-zinc-800 border border-zinc-800/60 text-zinc-400 hover:text-red-450 font-bold px-2.5 py-1.5 rounded-xl transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        `;
        }
      } else if (comp.type === 'Form') {
        const model = comp.props?.model;
        const fields = comp.props?.fields || [];
        const nameLower = model?.toLowerCase();

        if (model) {
          componentsJsx += `
        {/* Form Widget */}
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 shadow-2xl mb-8 max-w-2xl backdrop-blur-sm">
          <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider">Create ${model} Form</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            ${fields.map((f: any) => `
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">${f.label || f.name}</label>
              ${f.type === 'select' ? `
              <select
                name="${f.name}"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition font-medium"
              >
                ${(f.options || []).map((o: string) => `<option value="${o}">${o}</option>`).join('\n                ')}
              </select>
              ` : `
              <input
                type="${f.type || 'text'}"
                name="${f.name}"
                placeholder="Enter ${f.label || f.name}"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition font-medium"
              />
              `}
            </div>
            `).join('')}
            <button
              type="submit"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow"
            >
              Submit Form
            </button>
          </form>
        </div>
        `;
        }
      } else if (comp.type === 'Calculator') {
        componentsJsx += `
        {/* Interactive Calculator Widget */}
        <div className="flex justify-center p-6">
          <CalculatorWidget />
        </div>
        `;
      } else if (comp.type === 'Kanban') {
        const model = comp.props?.model || tableModel || '';
        componentsJsx += `
        {/* Kanban Board Widget */}
        <div className="mb-8">
          <KanbanWidget
            modelName="${model}"
            records={records}
            onRefresh={fetchRecords}
          />
        </div>
        `;
      } else if (comp.type === 'Calendar') {
        const model = comp.props?.model || tableModel || '';
        componentsJsx += `
        {/* Calendar Scheduler Widget */}
        <div className="mb-8">
          <CalendarWidget
            modelName="${model}"
            records={records}
            onRefresh={fetchRecords}
            onCreateClick={(dateStr) => {
              setEditData(null);
              setShowCreateModal(true);
              setTimeout(() => {
                const dateInput = document.querySelector('input[type="date"], input[name*="Date"], input[name*="Time"]') as HTMLInputElement;
                if (dateInput) {
                  dateInput.value = dateStr;
                }
              }, 100);
            }}
          />
        </div>
        `;
      } else if (comp.type === 'Chart') {
        const model = comp.props?.model || tableModel || '';
        const columns = comp.props?.columns || ['name', 'value'];
        componentsJsx += `
        {/* Analytics Chart Widget */}
        <div className="mb-8">
          <ChartWidget
            records={records}
            modelName="${model}"
            columns={${JSON.stringify(columns)}}
          />
        </div>
        `;
      } else if (comp.type === 'Checklist') {
        const model = comp.props?.model || tableModel || '';
        componentsJsx += `
        {/* Checklist Widget */}
        <div className="mb-8">
          <ChecklistWidget
            modelName="${model}"
            records={records}
            onRefresh={fetchRecords}
          />
        </div>
        `;
      } else if (comp.type === 'Notes') {
        componentsJsx += `
        {/* Scratchpad Notes Widget */}
        <div className="mb-8">
          <NotesWidget pageId="${pageId}" />
        </div>
        `;
      } else if (comp.type === 'WizardForm') {
        componentsJsx += `
        {/* Wizard Form Widget */}
        <div className="mb-8">
          <WizardFormWidget records={records} />
        </div>
        `;
      } else if (comp.type === 'GalleryGrid') {
        componentsJsx += `
        {/* Gallery Grid Widget */}
        <div className="mb-8">
          <GalleryGridWidget records={records} onCreateClick={() => { setFormErrors([]); setShowCreateModal(true); }} />
        </div>
        `;
      } else if (comp.type === 'Feed') {
        componentsJsx += `
        {/* Feed Widget */}
        <div className="mb-8">
          <FeedWidget records={records} onCreateClick={() => { setFormErrors([]); setShowCreateModal(true); }} />
        </div>
        `;
      } else if (comp.type === 'DetailView') {
        componentsJsx += `
        {/* Detail View Widget */}
        <div className="mb-8">
          <DetailViewWidget records={records} onCreateClick={() => { setFormErrors([]); setShowCreateModal(true); }} />
        </div>
        `;
      }
    }



    files.push({
      path: `src/app/${pageId}/page.tsx`,
      content: `${imports}
import { useRouter } from 'next/navigation';

export default function ${pageId.charAt(0).toUpperCase() + pageId.slice(1)}Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          ${authEnabled ? `router.push('/login');` : 'setUser({ name: "Guest" });'}
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        ${authEnabled ? `router.push('/login');` : 'setUser({ name: "Guest" });'}
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  const fetchRecords = async () => {
    if (!'${targetModelPath}') return;
    try {
      const res = await fetch('/api/${targetModelPath}');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && '${targetModelPath}') {
      fetchRecords();
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    formData.forEach((val, key) => { body[key] = val; });

    try {
      const res = await fetch('/api/${targetModelPath}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert("Record created successfully!");
        e.currentTarget.reset();
        fetchRecords();
      } else {
        const err = await res.json();
        alert("Failed: " + (err.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    formData.forEach((val, key) => { body[key] = val; });

    try {
      const res = await fetch('/api/${targetModelPath}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowCreateModal(false);
        e.currentTarget.reset();
        fetchRecords();
      } else {
        const err = await res.json();
        alert(err.error || "Error creating record");
      }
    } catch (e) {
      alert("Error submitting data");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    formData.forEach((val, key) => { body[key] = val; });

    try {
      const res = await fetch(\`/api/${targetModelPath}/\${editData.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchRecords();
      } else {
        const err = await res.json();
        alert(err.error || "Error updating record");
      }
    } catch (e) {
      alert("Error submitting data");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-zinc-900/60 backdrop-blur-md border-r border-zinc-850 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-zinc-850">
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-450 to-teal-350 tracking-wider uppercase">${appName}</h1>
          </div>
          <nav className="p-4 space-y-1.5">
            ${pages.map((p: any) => `
            <a
              href="/${p.id}"
              className={\`flex items-center px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-150 border border-transparent \${
                '${pageId}' === '${p.id}'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-md shadow-emerald-950/10'
                  : 'text-zinc-400 hover:bg-zinc-950/40 hover:text-zinc-200 hover:border-zinc-850'
              }\`}
            >
              ${p.title}
            </a>
            `).join('')}
          </nav>
        </div>
        
        {user && (
          <div className="p-4 border-t border-zinc-850 flex items-center justify-between bg-zinc-950/20">
            <div className="truncate pr-2">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Session User</p>
              <p className="text-xs font-bold truncate text-zinc-350">{user.name || user.email}</p>
            </div>
            ${authEnabled ? `
            <button
              onClick={handleLogout}
              className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-400 transition"
            >
              Logout
            </button>
            ` : ''}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">${page.title}</h2>
            <p className="text-sm text-zinc-400 mt-1">Workspace console dashboard</p>
          </div>
        </div>

        ${componentsJsx}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-700/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Create New ${tableModel}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              ${tableModelFields.map((f: any) => `
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">${f.name}</label>
                <input
                  type="${f.type === 'Int' || f.type === 'Float' ? 'number' : 'text'}"
                  name="${f.name}"
                  required={${!!f.required}}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              `).join('')}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:bg-zinc-700/30">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-700/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Edit Record</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              ${tableModelFields.map((f: any) => `
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">${f.name}</label>
                <input
                  type="${f.type === 'Int' || f.type === 'Float' ? 'number' : 'text'}"
                  name="${f.name}"
                  defaultValue={editData.${f.name} || ''}
                  required={${!!f.required}}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              `).join('')}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:bg-zinc-700/30">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

${hasCalculator ? `
function CalculatorWidget() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsFinished(false);
  };

  const handleBackspace = () => {
    if (isFinished) {
      handleClear();
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleToggleSign = () => {
    if (display !== '0') {
      if (display.startsWith('-')) {
        setDisplay(display.slice(1));
      } else {
        setDisplay('-' + display);
      }
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay(String(val / 100));
      setIsFinished(true);
    }
  };

  const handleNumber = (num: string) => {
    if (isFinished) {
      setDisplay(num);
      setIsFinished(false);
      return;
    }
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleDecimal = () => {
    if (isFinished) {
      setDisplay('0.');
      setIsFinished(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op: string) => {
    const lastChar = equation.trim().slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar) && display === '0') {
      setEquation(equation.slice(0, -2) + ' ' + op + ' ');
      return;
    }
    setEquation(equation + ' ' + display + ' ' + op + ' ');
    setDisplay('0');
    setIsFinished(false);
  };

  const handleEqual = () => {
    let fullEq = equation + ' ' + display;
    try {
      const cleanEq = fullEq.replace(/[^-()\\d/*+.]/g, '');
      const res = new Function("return " + cleanEq)();
      setDisplay(String(res));
      setEquation('');
      setIsFinished(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
      setIsFinished(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm mx-auto backdrop-blur-md">
      <div className="text-right mb-6 pr-2 font-mono">
        <div className="text-[10px] text-zinc-500 min-h-[15px] truncate tracking-wider">{equation || '\\u00A0'}</div>
        <div className="text-4xl font-black text-white mt-1 truncate select-all">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <button type="button" onClick={handleClear} className="h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-emerald-400 font-extrabold text-sm transition-colors duration-150">C</button>
        <button type="button" onClick={handleBackspace} className="h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-zinc-350 font-bold text-sm transition-colors duration-150">Del</button>
        <button type="button" onClick={handlePercent} className="h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-zinc-350 font-bold text-sm transition-colors duration-150">%</button>
        <button type="button" onClick={() => handleOperator('/')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">/</button>
        
        <button type="button" onClick={() => handleNumber('7')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">7</button>
        <button type="button" onClick={() => handleNumber('8')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">8</button>
        <button type="button" onClick={() => handleNumber('9')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">9</button>
        <button type="button" onClick={() => handleOperator('*')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">*</button>
        
        <button type="button" onClick={() => handleNumber('4')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">4</button>
        <button type="button" onClick={() => handleNumber('5')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">5</button>
        <button type="button" onClick={() => handleNumber('6')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">6</button>
        <button type="button" onClick={() => handleOperator('-')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">-</button>
        
        <button type="button" onClick={() => handleNumber('1')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">1</button>
        <button type="button" onClick={() => handleNumber('2')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">2</button>
        <button type="button" onClick={() => handleNumber('3')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">3</button>
        <button type="button" onClick={() => handleOperator('+')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">+</button>
        
        <button type="button" onClick={() => handleNumber('0')} className="h-12 col-span-2 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155 text-left pl-6">0</button>
        <button type="button" onClick={handleDecimal} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">.</button>
        <button type="button" onClick={handleEqual} className="h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-750 hover:to-teal-700 text-white font-bold text-sm transition-colors duration-150 shadow-lg shadow-emerald-950/20">=</button>
      </div>
    </div>
  );
}
` : ''}

\${hasKanban ? \`
interface KanbanWidgetProps {
  modelName: string;
  records: any[];
  onRefresh: () => void;
}

function KanbanWidget({ modelName, records, onRefresh }: KanbanWidgetProps) {
  const stages = modelName === 'Lead'
    ? ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost']
    : (modelName === 'Ticket' ? ['Open', 'In Progress', 'Resolved'] : ['To Do', 'In Progress', 'Done']);

  const moveCard = async (recordId: string, newStatus: string) => {
    try {
      const res = await fetch(\\\`/api/\\\${modelName.toLowerCase()}/\\\${recordId}\\\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto pb-6 pt-2">
      {stages.map((stage) => {
        const filtered = records.filter(r => {
          const val = String(r.status || '').trim();
          return val.toLowerCase() === stage.toLowerCase() || (!r.status && stage === stages[0]);
        });

        return (
          <div key={stage} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 min-w-[240px] flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-zinc-355 tracking-wider uppercase">{stage}</h4>
              <span className="text-[10px] font-black bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-full border border-zinc-700/40">
                {filtered.length}
              </span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-0.5 scrollbar-thin">
              {filtered.map(rec => {
                const title = rec.title || rec.fullName || rec.name || Object.values(rec)[0] || 'Untitled';
                return (
                  <div key={rec.id} className="bg-gradient-to-br from-slate-950 to-slate-900 border border-zinc-850 hover:border-zinc-750 p-4 rounded-xl shadow-xl transition-all group duration-200">
                    <p className="text-xs font-bold text-white mb-2">{String(title)}</p>
                    
                    <div className="space-y-1 mb-4">
                      {Object.entries(rec).map(([key, val]) => {
                        if (['id', 'status', 'title', 'fullName', 'name', 'createdAt', 'updatedAt'].includes(key)) return null;
                        if (typeof val === 'object') return null;
                        return (
                          <div key={key} className="flex justify-between text-[10px]">
                            <span className="text-zinc-500 capitalize">{key}:</span>
                            <span className="text-zinc-355 truncate max-w-[130px] font-mono">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-zinc-850/80">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Status</span>
                      <select
                        value={rec.status || stages[0]}
                        onChange={(e) => moveCard(rec.id, e.target.value)}
                        className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 text-[10px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none cursor-pointer font-semibold transition"
                      >
                        {stages.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-xl py-12 text-center">
                  <p className="text-[10px] text-zinc-600 italic">No items here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
\` : ''}

\${hasCalendar ? \`
interface CalendarWidgetProps {
  modelName: string;
  records: any[];
  onRefresh: () => void;
  onCreateClick: (dateStr: string) => void;
}

function CalendarWidget({ modelName, records, onRefresh, onCreateClick }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDateString = (r: any) => {
    return r.sessionDate || r.bookingDate || r.returnDate || r.classDate || r.date || '';
  };

  const getRecordTitle = (r: any) => {
    return r.memberName || r.guestName || r.bookTitle || r.courseName || r.title || r.fullName || 'Booking';
  };

  const handleDelete = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scheduled item?')) return;
    try {
      const res = await fetch(\\\`/api/\\\ + modelName.toLowerCase() + \\\`/\\\${recordId}\\\`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const dateStr = \\\`\\\${y}-\\\${String(m + 1).padStart(2, '0')}-\\\${String(d).padStart(2, '0')}\\\`;
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = \\\`\\\${year}-\\\${String(month + 1).padStart(2, '0')}-\\\${String(d).padStart(2, '0')}\\\`;
    calendarDays.push({ day: d, isCurrentMonth: true, dateStr });
  }

  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    const dateStr = \\\`\\\${y}-\\\${String(m + 1).padStart(2, '0')}-\\\${String(d).padStart(2, '0')}\\\`;
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr });
  }

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider">{monthNames[month]} {year}</h3>
          <p className="text-xs text-zinc-450 mt-0.5">Click any day cell to add an entry.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="border border-zinc-800 bg-zinc-950/60 text-zinc-350 p-2 rounded-xl text-xs font-bold transition">&larr; Prev</button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="border border-zinc-800 bg-zinc-950/60 text-zinc-350 p-2 rounded-xl text-xs font-bold transition">Next &rarr;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[1px] bg-zinc-850 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-zinc-950 text-zinc-500 py-3 text-[10px] font-black uppercase tracking-widest">{d}</div>
        ))}

        {calendarDays.map((cell, idx) => {
          const dayRecords = records.filter(r => String(getDateString(r)).trim().startsWith(cell.dateStr));
          return (
            <div
              key={idx}
              onClick={() => onCreateClick(cell.dateStr)}
              className={\\\`min-h-[100px] bg-zinc-900/40 p-2 text-left flex flex-col justify-between hover:bg-zinc-800/35 transition cursor-pointer border-b border-r border-zinc-850/60 relative group \\\${cell.isCurrentMonth ? 'text-zinc-200' : 'text-zinc-650'}\\\`}
            >
              <span className="text-xs font-bold font-mono">{cell.day}</span>
              <div className="flex-1 overflow-y-auto space-y-1 mt-1 max-h-[70px] scrollbar-none">
                {dayRecords.map(r => (
                  <div key={r.id} onClick={e => e.stopPropagation()} className="bg-emerald-600/10 border border-emerald-500/20 rounded-lg p-1.5 flex justify-between items-center transition">
                    <span className="text-[9px] font-black text-zinc-100 truncate">{getRecordTitle(r)}</span>
                    <button onClick={e => handleDelete(e, r.id)} className="text-red-400 hover:text-red-300 text-[9px] font-bold">&times;</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
\` : ''}

\${hasChart ? \`
interface ChartWidgetProps {
  records: any[];
  modelName: string;
  columns: string[];
}

function ChartWidget({ records, modelName, columns }: ChartWidgetProps) {
  if (records.length === 0) {
    return (
      <div className="bg-zinc-900/40 border border-dashed border-zinc-855 rounded-2xl p-10 text-center text-zinc-500 italic text-xs">
        No records available to chart.
      </div>
    );
  }

  const labelKey = columns[0] || 'name';
  const valKey = columns[1] || 'value';

  const chartData = records.map(r => {
    const label = String(r[labelKey] || 'Entry');
    const val = parseFloat(r[valKey]);
    return { label, value: isNaN(val) ? 1 : val };
  }).slice(0, 10);

  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-base font-black text-white uppercase tracking-wider mb-4">{modelName} Distribution</h3>
      <div className="space-y-4">
        {chartData.map((item, idx) => {
          const percentage = (item.value / maxVal) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-semibold">{item.label}</span>
                <span className="text-emerald-400 font-mono">{item.value}</span>
              </div>
              <div className="h-2.5 bg-zinc-950 rounded-full border border-zinc-850">
                <div style={{ width: \\\`\\\${percentage}%\\\` }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
\` : ''}

\${hasChecklist ? \`
interface ChecklistWidgetProps {
  modelName: string;
  records: any[];
  onRefresh: () => void;
}

function ChecklistWidget({ modelName, records, onRefresh }: ChecklistWidgetProps) {
  const [newItemTitle, setNewItemTitle] = useState('');

  const toggleRecord = async (rec: any) => {
    let updateBody: any = {};
    if (rec.completed !== undefined) {
      updateBody.completed = !rec.completed;
    } else if (rec.status !== undefined) {
      updateBody.status = rec.status === 'Done' ? 'To Do' : 'Done';
    } else {
      updateBody.completed = !rec.completed;
    }

    try {
      const res = await fetch(\\\`/api/\\\ + modelName.toLowerCase() + \\\`/\\\${rec.id}\\\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const body: any = {
      title: newItemTitle.trim(),
      status: 'To Do',
      completed: false
    };

    try {
      const res = await fetch(\\\`/api/\\\ + modelName.toLowerCase() + \\\`\\\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setNewItemTitle('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isChecked = (rec: any) => {
    if (rec.completed !== undefined) return !!rec.completed;
    if (rec.status !== undefined) return rec.status === 'Done' || rec.status === 'Completed';
    return false;
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 max-w-xl shadow-2xl">
      <h3 className="text-base font-black text-white uppercase tracking-wider mb-4">{modelName} Checklist</h3>
      
      <form onSubmit={handleAddItem} className="mb-5 flex gap-2">
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Add new checklist entry..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
        />
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl">Add</button>
      </form>

      <div className="space-y-2">
        {records.map(rec => {
          const title = rec.title || rec.fullName || rec.name || 'Item';
          const done = isChecked(rec);
          return (
            <div key={rec.id} onClick={() => toggleRecord(rec)} className="bg-zinc-955/40 border border-zinc-850 hover:border-zinc-800 rounded-xl p-3 flex items-center gap-3 cursor-pointer">
              <div className={\\\`w-4 h-4 rounded border flex items-center justify-center \\\${done ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700 bg-zinc-900'}\\\`}>
                {done && (
                  <svg className="w-2.5 h-2.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={\\\`text-xs font-semibold \\\${done ? 'line-through text-zinc-500' : 'text-zinc-200'}\\\`}>{String(title)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
\` : ''}

\${hasNotes ? \`
interface NoteItem {
  id: string;
  content: string;
  color: string;
}

function NotesWidget({ pageId }: { pageId: string }) {
  const [notes, setNotes] = useState<NoteItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(\\\`app-notes-\\\${pageId}\\\`);
    if (saved) {
      try { setNotes(JSON.parse(saved)); } catch(e){}
    }
  }, [pageId]);

  const saveNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    localStorage.setItem(\\\`app-notes-\\\${pageId}\\\`, JSON.stringify(updated));
  };

  const addNote = () => {
    const colors = [
      'bg-amber-400/90 border-amber-300',
      'bg-sky-400/90 border-sky-300',
      'bg-rose-400/90 border-rose-300',
      'bg-emerald-400/90 border-emerald-300',
      'bg-purple-400/90 border-purple-300'
    ];
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      content: '',
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    saveNotes([...notes, newNote]);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-black text-white uppercase tracking-wider">Draft Ideas Scratchpad</h3>
        <button onClick={addNote} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition">+ Add Note</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {notes.map(note => (
          <div key={note.id} className={\\\`rounded-2xl p-4 flex flex-col h-48 border text-zinc-900 \\\${note.color}\\\`}>
            <div className="flex justify-end mb-2">
              <button onClick={() => saveNotes(notes.filter(n => n.id !== note.id))} className="text-zinc-700 hover:text-black font-black text-xs">&times;</button>
            </div>
            <textarea
              value={note.content}
              onChange={e => saveNotes(notes.map(n => n.id === note.id ? { ...n, content: e.target.value } : n))}
              placeholder="Start typing..."
              className="flex-1 bg-transparent resize-none focus:outline-none text-xs font-semibold placeholder-slate-700 leading-relaxed scrollbar-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
\` : ''}

\${hasWizardForm ? \`
function WizardFormWidget({ records }: any) {
  const [step, setStep] = useState(0);
  if (!records || records.length === 0) return <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">No steps or questions found. Add records first!</div>;
  const current = records[step];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Interactive Wizard</span>
          <h3 className="text-xl font-black text-white mt-2">Step {step + 1} of {records.length}</h3>
        </div>
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-zinc-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-emerald-500 transition-all duration-500" strokeDasharray={(((step + 1) / records.length) * 100) + ", 100"} strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span className="absolute text-[10px] font-bold text-white">{Math.round(((step + 1) / records.length) * 100)}%</span>
        </div>
      </div>
      <div className="mb-8 space-y-4">
        {Object.entries(current).map(([k, v]) => {
          if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === 'userId') return null;
          return (
            <div key={k} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
              <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{k}</span>
              <span className="text-sm font-medium text-zinc-200">{String(v)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-300 disabled:opacity-30 transition-colors">
          Previous Step
        </button>
        <button onClick={() => { if (step < records.length - 1) setStep(step + 1); else alert('Wizard Completed!'); }} className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black tracking-wide shadow-lg shadow-emerald-900/50 transition-all">
          {step < records.length - 1 ? 'Next Step' : 'Complete & Submit'}
        </button>
      </div>
    </div>
  );
}
\` : ''}

\${hasGalleryGrid ? \`
function GalleryGridWidget({ records, onCreateClick }: any) {
  if (!records || records.length === 0) return (
    <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center gap-4">
      <p>No items in the gallery.</p>
      {onCreateClick && <button onClick={onCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl">+ Add Record</button>}
    </div>
  );
  return (
    <div className="relative">
      {onCreateClick && (
        <div className="flex justify-end mb-4">
          <button onClick={onCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50">+ Add Record</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {records.map((r: any, i: number) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl hover:border-zinc-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
            <span className="text-5xl drop-shadow-lg opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all">📸</span>
          </div>
          <div className="p-5">
            <h4 className="font-bold text-white mb-2 truncate text-lg">{r.name || r.title || r.productName || 'Item ' + (i+1)}</h4>
            <div className="space-y-1">
              {Object.entries(r).slice(0, 3).map(([k, v]) => {
                if (k === 'id' || k === 'createdAt' || k === 'updatedAt') return null;
                return <p key={k} className="text-xs text-zinc-400 line-clamp-1"><span className="font-semibold text-zinc-500">{k}:</span> {String(v)}</p>;
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800/60 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">View Details</span>
              <span className="text-[10px] text-zinc-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
\` : ''}

\${hasFeed ? \`
function FeedWidget({ records, onCreateClick }: any) {
  if (!records || records.length === 0) return (
    <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center gap-4">
      <p>Your feed is empty.</p>
      {onCreateClick && <button onClick={onCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl">+ Add Post</button>}
    </div>
  );
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {onCreateClick && (
        <div className="flex justify-end">
          <button onClick={onCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50">+ New Post</button>
        </div>
      )}
      {records.map((r: any, i: number) => {
        const author = String(r.name || r.author || r.user || r.username || 'Anonymous User');
        return (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md flex gap-5 hover:bg-zinc-800/30 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
              {author.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-zinc-100">{author}</h4>
                  <span className="text-[10px] text-zinc-500 font-medium">@{author.toLowerCase().replace(/\\s/g, '')}</span>
                </div>
                <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-1 rounded-full">{r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : ''}</span>
              </div>
              <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40">
                {r.content || r.message || r.post || r.description || JSON.stringify(r)}
              </div>
              <div className="flex gap-4 mt-4">
                <button className="text-[11px] font-semibold text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>❤️</span> Like
                </button>
                <button className="text-[11px] font-semibold text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>💬</span> Comment
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
\` : ''}

\${hasDetailView ? \`
function DetailViewWidget({ records, onCreateClick }: any) {
  if (!records || records.length === 0) return (
    <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center gap-4">
      <p>No record selected for detail view.</p>
      {onCreateClick && <button onClick={onCreateClick} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl">+ Add Record</button>}
    </div>
  );
  const r = records[0];
  return (
    <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="h-64 bg-gradient-to-br from-zinc-800 to-emerald-950 flex items-end p-8 border-b border-zinc-800 relative">
        <div className="absolute top-6 right-6 flex gap-2">
           <button className="bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-700 text-xs font-bold text-white px-4 py-2 rounded-xl backdrop-blur-md transition-colors">Edit</button>
           <button className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-4 py-2 rounded-xl transition-colors shadow-lg">Share</button>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{r.title || r.name || r.id || 'Detail View'}</h1>
      </div>
      <div className="p-8 bg-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {Object.entries(r).map(([k, v]) => {
            if (k === 'id') return null;
            return (
              <div key={k} className="border-b border-zinc-800/50 pb-4">
                <h3 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1.5">{k}</h3>
                <p className="text-sm font-medium text-zinc-200">{String(v)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
\` : ''}
`
    });
  }

  // 15. Create Home Redirect page & Login pages
  files.push({
    path: 'src/app/page.tsx',
    content: `import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to first page configuration or login
  redirect('/${pages[0]?.id || 'login'}');
}
`
  });

  if (authEnabled) {
    // Generated app login page
    files.push({
      path: 'src/app/login/page.tsx',
      content: `import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-center text-emerald-400 uppercase tracking-widest mb-6">${appName}</h2>
        <form action="/api/auth/login" method="POST" className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const res = await fetch(form.action, {
            method: form.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
          });
          if (res.ok) window.location.href = '/${pages[0]?.id || 'dashboard'}';
          else alert('Invalid login credentials');
        }}>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Email</label>
            <input type="email" name="email" required className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Password</label>
            <input type="password" name="password" required className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition mt-4 text-sm uppercase">Sign In</button>
        </form>
      </div>
    </div>
  );
}
`
    });
  }

  return files;
}
