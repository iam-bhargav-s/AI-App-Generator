import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateCodebase } from '../src/lib/codeGenerator';

describe('Code Generator Tests', () => {
  const fullAppConfig = {
    name: 'Customer CRM',
    description: 'A simple CRM system',
    auth: {
      enabled: true,
      userModel: 'User',
      roles: ['Admin']
    },
    database: {
      models: [
        {
          name: 'Contact',
          fields: [
            { name: 'firstName', type: 'String', required: true },
            { name: 'lastName', type: 'String' },
            { name: 'email', type: 'String', unique: true, required: true },
            { name: 'age', type: 'Int', defaultValue: 18 }
          ]
        }
      ]
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
              id: 'stats',
              type: 'StatsGrid',
              props: {
                items: [
                  { label: 'Total Contacts', value: '150', change: '+12%' }
                ]
              }
            },
            {
              id: 'contact-table',
              type: 'DataTable',
              props: {
                model: 'Contact',
                columns: ['firstName', 'lastName', 'email'],
                actions: ['create', 'edit', 'delete']
              }
            }
          ]
        }
      ]
    }
  };

  it('should generate baseline project configuration files', () => {
    const files = generateCodebase(fullAppConfig);

    // Verify presence of basic config files
    const packageJson = files.find((f) => f.path === 'package.json');
    assert.ok(packageJson);
    const pkg = JSON.parse(packageJson.content);
    assert.strictEqual(pkg.name, 'customer-crm');
    assert.ok(pkg.dependencies.next);

    const tsConfig = files.find((f) => f.path === 'tsconfig.json');
    assert.ok(tsConfig);

    const tailwindConfig = files.find((f) => f.path === 'tailwind.config.ts');
    assert.ok(tailwindConfig);
  });

  it('should generate customized prisma schema with models', () => {
    const files = generateCodebase(fullAppConfig);
    const prismaSchemaFile = files.find((f) => f.path === 'prisma/schema.prisma');
    assert.ok(prismaSchemaFile);

    const schema = prismaSchemaFile.content;

    // Check that Contact model is in schema
    assert.match(schema, /model Contact/);
    assert.match(schema, /firstName\s+String/);
    assert.match(schema, /lastName\s+String\?/);
    assert.match(schema, /email\s+String\s+@unique/);
    assert.match(schema, /age\s+Int\?/);
  });

  it('should generate Auth API endpoints if auth is enabled', () => {
    const files = generateCodebase(fullAppConfig);
    
    const registerRoute = files.find((f) => f.path === 'src/app/api/auth/register/route.ts');
    assert.ok(registerRoute);
    assert.match(registerRoute.content, /hashPassword/);

    const loginRoute = files.find((f) => f.path === 'src/app/api/auth/login/route.ts');
    assert.ok(loginRoute);
    assert.match(loginRoute.content, /comparePassword/);

    const logoutRoute = files.find((f) => f.path === 'src/app/api/auth/logout/route.ts');
    assert.ok(logoutRoute);
  });

  it('should not generate Auth API endpoints if auth is disabled', () => {
    const configWithoutAuth = {
      ...fullAppConfig,
      auth: { enabled: false }
    };
    const files = generateCodebase(configWithoutAuth);
    
    const registerRoute = files.find((f) => f.path === 'src/app/api/auth/register/route.ts');
    assert.strictEqual(registerRoute, undefined);
  });

  it('should generate model API endpoints', () => {
    const files = generateCodebase(fullAppConfig);

    const routeFile = files.find((f) => f.path === 'src/app/api/contact/route.ts');
    assert.ok(routeFile);
    assert.match(routeFile.content, /db\.contact\.findMany/);
    assert.match(routeFile.content, /db\.contact\.create/);

    const recordRouteFile = files.find((f) => f.path === 'src/app/api/contact/[id]/route.ts');
    assert.ok(recordRouteFile);
    assert.match(recordRouteFile.content, /db\.contact\.update/);
    assert.match(recordRouteFile.content, /db\.contact\.delete/);
  });

  it('should generate page components with corresponding widgets', () => {
    const files = generateCodebase(fullAppConfig);

    const pageFile = files.find((f) => f.path === 'src/app/dashboard/page.tsx');
    assert.ok(pageFile);

    const pageContent = pageFile.content;
    // Should render DashboardPage component
    assert.match(pageContent, /export default function DashboardPage\(\)/);
    // Should render StatsGrid markup
    assert.match(pageContent, /Stats Grid Widget/);
    // Should render DataTable markup
    assert.match(pageContent, /Data Table Widget: Contact/);
  });
});
