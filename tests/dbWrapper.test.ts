import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { dbWrapper } from '../src/lib/dbWrapper';
import { db } from '../src/lib/db';

const FALLBACK_FILE = path.join(process.cwd(), 'src', 'data', 'db_fallback.json');

describe('Database Wrapper Tests', () => {
  let fallbackBackup: string | null = null;

  before(() => {
    // Back up the fallback file if it exists
    if (fs.existsSync(FALLBACK_FILE)) {
      fallbackBackup = fs.readFileSync(FALLBACK_FILE, 'utf-8');
    }
    // Clean start for fallback file
    fs.mkdirSync(path.dirname(FALLBACK_FILE), { recursive: true });
    fs.writeFileSync(
      FALLBACK_FILE,
      JSON.stringify({ users: [], apps: [], records: [], workflowLogs: [] }, null, 2)
    );
  });

  after(() => {
    // Restore the backup
    if (fallbackBackup !== null) {
      fs.writeFileSync(FALLBACK_FILE, fallbackBackup);
    } else if (fs.existsSync(FALLBACK_FILE)) {
      fs.unlinkSync(FALLBACK_FILE);
    }
  });

  describe('Fallback Database Mode (isDbAvailable = false)', () => {
    let originalIsDbAvailable: any;

    before(() => {
      originalIsDbAvailable = dbWrapper.isDbAvailable;
      dbWrapper.isDbAvailable = async () => false;
    });

    after(() => {
      dbWrapper.isDbAvailable = originalIsDbAvailable;
    });

    beforeEach(() => {
      // Clear fallback store for each test
      fs.writeFileSync(
        FALLBACK_FILE,
        JSON.stringify({ users: [], apps: [], records: [], workflowLogs: [] }, null, 2)
      );
    });

    it('should create and find users in fallback mode', async () => {
      const user = await dbWrapper.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      assert.ok(user.id);
      assert.strictEqual(user.email, 'test@example.com');
      assert.strictEqual(user.name, 'Test User');

      // Query by email
      const queriedByEmail = await dbWrapper.findUserByEmail('test@example.com');
      assert.ok(queriedByEmail);
      assert.strictEqual(queriedByEmail?.id, user.id);

      // Query by ID (should exclude password field from selection)
      const queriedById = await dbWrapper.findUserById(user.id);
      assert.ok(queriedById);
      assert.strictEqual(queriedById?.email, 'test@example.com');
      assert.strictEqual(queriedById?.name, 'Test User');
      assert.strictEqual((queriedById as any).password, undefined);
    });

    it('should perform CRUD operations on apps in fallback mode', async () => {
      const appData = {
        name: 'Inventory App',
        description: 'Manage stocks',
        config: { version: 1 },
        userId: 'user-123'
      };

      const app = await dbWrapper.createApp(appData);
      assert.ok(app.id);
      assert.strictEqual(app.name, 'Inventory App');

      // List apps
      const apps = await dbWrapper.listApps('user-123');
      assert.strictEqual(apps.length, 1);
      assert.strictEqual(apps[0].id, app.id);

      // Get app
      const fetchedApp = await dbWrapper.getApp(app.id);
      assert.ok(fetchedApp);
      assert.strictEqual(fetchedApp?.name, 'Inventory App');

      // Update app
      const updatedApp = await dbWrapper.updateApp(app.id, { name: 'Updated App' });
      assert.strictEqual(updatedApp.name, 'Updated App');

      // Delete app
      await dbWrapper.deleteApp(app.id);
      const deletedApp = await dbWrapper.getApp(app.id);
      assert.strictEqual(deletedApp, null);
    });

    it('should perform CRUD operations on records in fallback mode', async () => {
      const appId = 'app-xyz';
      const modelName = 'Task';
      const recordData = { title: 'Write tests', done: false };

      const record = await dbWrapper.createRecord(appId, modelName, recordData, 'user-123');
      assert.ok(record.id);
      assert.deepStrictEqual(record.data, recordData);
      assert.strictEqual(record.userId, 'user-123');

      // Get records for model
      const records = await dbWrapper.getRecords(appId, modelName);
      assert.strictEqual(records.length, 1);
      assert.strictEqual(records[0].id, record.id);

      // Filter records by userId
      const filtered = await dbWrapper.getRecords(appId, modelName, { userId: 'other-user' });
      assert.strictEqual(filtered.length, 0);

      // Get single record
      const fetchedRecord = await dbWrapper.getRecord(record.id);
      assert.ok(fetchedRecord);
      assert.deepStrictEqual(fetchedRecord?.data, recordData);

      // Update record
      const updatedRecord = await dbWrapper.updateRecord(record.id, { title: 'Write tests', done: true });
      assert.strictEqual((updatedRecord.data as any).done, true);

      // Delete record
      await dbWrapper.deleteRecord(record.id);
      const deletedRecord = await dbWrapper.getRecord(record.id);
      assert.strictEqual(deletedRecord, null);
    });

    it('should log workflows in fallback mode', async () => {
      const appId = 'app-xyz';
      const log = await dbWrapper.logWorkflow(
        appId,
        'wf-1',
        'Notify Webhook',
        'RECORD_CREATED',
        'SUCCESS',
        'Action executed successfully'
      );

      assert.ok(log.id);
      assert.strictEqual(log.status, 'SUCCESS');

      const logs = await dbWrapper.getWorkflowLogs(appId);
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].id, log.id);
      assert.strictEqual(logs[0].logs, 'Action executed successfully');
    });
  });

  describe('Prisma Database Mode (isDbAvailable = true)', () => {
    let originalIsDbAvailable: any;
    let originalPrismaClient: any;
    const mockPrismaCalls: { method: string; args: any[] }[] = [];

    before(() => {
      originalIsDbAvailable = dbWrapper.isDbAvailable;
      dbWrapper.isDbAvailable = async () => true;

      // Swap out Prisma methods with mocks
      originalPrismaClient = {
        user: db.user,
        app: db.app,
        record: db.record,
        workflowLog: db.workflowLog
      };

      // Mock user db calls
      (db as any).user = {
        create: async (args: any) => {
          mockPrismaCalls.push({ method: 'user.create', args: [args] });
          return { id: 'prisma-user-1', ...args.data };
        },
        findUnique: async (args: any) => {
          mockPrismaCalls.push({ method: 'user.findUnique', args: [args] });
          return { id: 'prisma-user-1', email: args.where?.email, password: 'hashedpassword' };
        }
      };

      // Mock app db calls
      (db as any).app = {
        create: async (args: any) => {
          mockPrismaCalls.push({ method: 'app.create', args: [args] });
          return { id: 'prisma-app-1', ...args.data };
        },
        findMany: async (args: any) => {
          mockPrismaCalls.push({ method: 'app.findMany', args: [args] });
          return [{ id: 'prisma-app-1', name: 'Prisma App', userId: args.where?.userId }];
        }
      };
    });

    after(() => {
      dbWrapper.isDbAvailable = originalIsDbAvailable;
      (db as any).user = originalPrismaClient.user;
      (db as any).app = originalPrismaClient.app;
      (db as any).record = originalPrismaClient.record;
      (db as any).workflowLog = originalPrismaClient.workflowLog;
    });

    beforeEach(() => {
      mockPrismaCalls.length = 0;
    });

    it('should route user creation to Prisma', async () => {
      const user = await dbWrapper.createUser({ email: 'prisma@test.com', password: 'pw' });
      assert.strictEqual(user.id, 'prisma-user-1');
      assert.strictEqual(mockPrismaCalls.length, 1);
      assert.strictEqual(mockPrismaCalls[0].method, 'user.create');
      assert.deepStrictEqual(mockPrismaCalls[0].args[0].data, { email: 'prisma@test.com', password: 'pw' });
    });

    it('should route app creation and listing to Prisma', async () => {
      const app = await dbWrapper.createApp({ name: 'App Prisma', userId: 'user-xyz', config: {} });
      assert.strictEqual(app.id, 'prisma-app-1');
      assert.strictEqual(mockPrismaCalls.some((c) => c.method === 'app.create'), true);

      const list = await dbWrapper.listApps('user-xyz');
      assert.strictEqual(list.length, 1);
      assert.strictEqual(mockPrismaCalls.some((c) => c.method === 'app.findMany'), true);
    });
  });
});
