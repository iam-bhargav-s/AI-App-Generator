import fs from 'fs';
import path from 'path';
import { db } from './db';

const FALLBACK_FILE = process.env.NODE_ENV === 'production' 
  ? '/tmp/db_fallback.json' 
  : path.join(process.cwd(), 'src', 'data', 'db_fallback.json');

// Ensure fallback file directory exists
function ensureFallbackFile() {
  const dir = path.dirname(FALLBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    fs.writeFileSync(
      FALLBACK_FILE,
      JSON.stringify({ users: [], apps: [], records: [], workflowLogs: [] }, null, 2)
    );
  }
}

function readFallback() {
  ensureFallbackFile();
  try {
    const content = fs.readFileSync(FALLBACK_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { users: [], apps: [], records: [], workflowLogs: [] };
  }
}

function writeFallback(data: any) {
  ensureFallbackFile();
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
}

let cachedDbAvailable: boolean | null = null;
let lastCheckedTime = 0;
const CACHE_TTL = 10000; // Cache status for 10 seconds

export const dbWrapper = {
  async isDbAvailable(): Promise<boolean> {
    const now = Date.now();
    if (cachedDbAvailable !== null && (now - lastCheckedTime) < CACHE_TTL) {
      return cachedDbAvailable;
    }

    try {
      // Race the SELECT 1 query against a 1-second timeout
      const checkPromise = db.$queryRaw`SELECT 1`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB Timeout')), 5000)
      );
      await Promise.race([checkPromise, timeoutPromise]);
      cachedDbAvailable = true;
    } catch (e) {
      cachedDbAvailable = false;
    }
    
    lastCheckedTime = Date.now();
    return cachedDbAvailable;
  },

  // USER CRUD
  async createUser(data: any) {
    if (await this.isDbAvailable()) {
      return db.user.create({ data });
    }
    
    const store = readFallback();
    const newUser = {
      id: Math.random().toString(36).substring(2, 11),
      email: data.email,
      password: data.password,
      name: data.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    writeFallback(store);
    return newUser;
  },

  async findUserByEmail(email: string) {
    if (await this.isDbAvailable()) {
      return db.user.findUnique({ where: { email } });
    }

    const store = readFallback();
    return store.users.find((u: any) => u.email === email) || null;
  },

  async findUserById(id: string) {
    if (await this.isDbAvailable()) {
      return db.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, createdAt: true } });
    }

    const store = readFallback();
    const user = store.users.find((u: any) => u.id === id);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  },

  // APPS CRUD
  async createApp(data: { name: string; description?: string; config: any; userId: string }) {
    if (await this.isDbAvailable()) {
      return db.app.create({ data });
    }

    const store = readFallback();
    const newApp = {
      id: Math.random().toString(36).substring(2, 11),
      name: data.name,
      description: data.description || '',
      config: data.config,
      userId: data.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.apps.push(newApp);
    writeFallback(store);
    return newApp;
  },

  async listApps(userId: string) {
    if (await this.isDbAvailable()) {
      return db.app.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    }

    const store = readFallback();
    return store.apps
      .filter((app: any) => app.userId === userId)
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getApp(id: string) {
    if (await this.isDbAvailable()) {
      return db.app.findUnique({ where: { id } });
    }

    const store = readFallback();
    return store.apps.find((app: any) => app.id === id) || null;
  },

  async updateApp(id: string, data: { name?: string; description?: string; config?: any }) {
    if (await this.isDbAvailable()) {
      return db.app.update({ where: { id }, data });
    }

    const store = readFallback();
    const appIndex = store.apps.findIndex((app: any) => app.id === id);
    if (appIndex === -1) throw new Error('App not found');
    
    store.apps[appIndex] = {
      ...store.apps[appIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    writeFallback(store);
    return store.apps[appIndex];
  },

  async deleteApp(id: string) {
    if (await this.isDbAvailable()) {
      return db.app.delete({ where: { id } });
    }

    const store = readFallback();
    store.apps = store.apps.filter((app: any) => app.id !== id);
    store.records = store.records.filter((rec: any) => rec.appId !== id);
    store.workflowLogs = store.workflowLogs.filter((log: any) => log.appId !== id);
    writeFallback(store);
    return { id };
  },

  // RECORDS CRUD
  async createRecord(appId: string, modelName: string, data: any, userId?: string | null) {
    if (await this.isDbAvailable()) {
      return db.record.create({
        data: {
          appId,
          modelName,
          data,
          userId: userId || null,
        },
      });
    }

    const store = readFallback();
    const newRecord = {
      id: Math.random().toString(36).substring(2, 11),
      appId,
      modelName,
      data,
      userId: userId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.records.push(newRecord);
    writeFallback(store);
    return newRecord;
  },

  async getRecords(appId: string, modelName: string, filters: { userId?: string | null } = {}) {
    if (await this.isDbAvailable()) {
      const query: any = { appId, modelName };
      if (filters.userId !== undefined) {
        query.userId = filters.userId;
      }
      return db.record.findMany({ 
        where: {
          ...query,
          modelName: { equals: modelName, mode: 'insensitive' }
        }, 
        orderBy: { createdAt: 'desc' } 
      });
    }

    const store = readFallback();
    return store.records
      .filter((rec: any) => {
        const matchApp = rec.appId === appId;
        const matchModel = rec.modelName.toLowerCase() === modelName.toLowerCase();
        const matchUser = filters.userId === undefined || rec.userId === filters.userId;
        return matchApp && matchModel && matchUser;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getRecord(id: string) {
    if (await this.isDbAvailable()) {
      return db.record.findUnique({ where: { id } });
    }

    const store = readFallback();
    return store.records.find((rec: any) => rec.id === id) || null;
  },

  async updateRecord(id: string, data: any) {
    if (await this.isDbAvailable()) {
      return db.record.update({
        where: { id },
        data: { data },
      });
    }

    const store = readFallback();
    const index = store.records.findIndex((rec: any) => rec.id === id);
    if (index === -1) throw new Error('Record not found');

    store.records[index] = {
      ...store.records[index],
      data,
      updatedAt: new Date().toISOString(),
    };
    writeFallback(store);
    return store.records[index];
  },

  async deleteRecord(id: string) {
    if (await this.isDbAvailable()) {
      return db.record.delete({ where: { id } });
    }

    const store = readFallback();
    store.records = store.records.filter((rec: any) => rec.id !== id);
    writeFallback(store);
    return { id };
  },

  // WORKFLOW LOGS
  async logWorkflow(appId: string, workflowId: string, name: string, event: string, status: 'SUCCESS' | 'FAILED', logs: string) {
    if (await this.isDbAvailable()) {
      return db.workflowLog.create({
        data: {
          appId,
          workflowId,
          name,
          event,
          status,
          logs,
        },
      });
    }

    const store = readFallback();
    const newLog = {
      id: Math.random().toString(36).substring(2, 11),
      appId,
      workflowId,
      name,
      event,
      status,
      logs,
      createdAt: new Date().toISOString(),
    };
    store.workflowLogs.push(newLog);
    writeFallback(store);
    return newLog;
  },

  async getWorkflowLogs(appId: string) {
    if (await this.isDbAvailable()) {
      return db.workflowLog.findMany({ where: { appId }, orderBy: { createdAt: 'desc' } });
    }

    const store = readFallback();
    return store.workflowLogs
      .filter((log: any) => log.appId === appId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};
