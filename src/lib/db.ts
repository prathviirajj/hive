import { PrismaClient } from '@prisma/client'
import { createRequire } from 'node:module'
import * as fs from 'node:fs'
import * as path from 'node:path'

const nodeRequire = createRequire(import.meta.url);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function resolveDbUrl(): string {
  // If running on Vercel, copy SQLite db to /tmp so it is writable and accessible to serverless lambda
  if (process.env.VERCEL) {
    const tmpDbPath = path.join('/tmp', 'custom.db');
    const sourceDbPath = path.join(process.cwd(), 'db', 'custom.db');
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
      try {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
        console.log(`[db.ts] Copied db from ${sourceDbPath} to ${tmpDbPath}`);
      } catch (e) {
        console.error(`[db.ts] Failed copying db to /tmp:`, e);
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      return `file:${tmpDbPath}`;
    }
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return "file:../db/custom.db";
}

function loadFreshPrismaClient(): any {
  if (process.env.NODE_ENV === 'production') {
    return PrismaClient;
  }
  try {
    const probe = new PrismaClient({ log: [] } as any);
    const models = (probe as any)._runtimeDataModel?.models || {};
    if ('QmsUser' in models) return PrismaClient;
  } catch {}

  try {
    const prismaClientPath = path.resolve(process.cwd(), 'node_modules/.prisma/client/index.js');
    if (fs.existsSync(prismaClientPath)) {
      const content = fs.readFileSync(prismaClientPath, 'utf-8');
      const moduleObj: any = { exports: {} };
      const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', content);
      fn(moduleObj, moduleObj.exports, nodeRequire, path.dirname(prismaClientPath), prismaClientPath);
      return moduleObj.exports.PrismaClient;
    }
  } catch (e) {
    console.error('[db.ts] Failed to load fresh PrismaClient:', e);
  }
  return PrismaClient;
}

const FreshClient = loadFreshPrismaClient();

function makeClient() {
  const dbUrl = resolveDbUrl();
  return new FreshClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any);
}

let db: any;
const cached = globalForPrisma.prisma;
const cachedHasModel = cached && typeof cached.qmsUser !== 'undefined';

if (cached && cachedHasModel) {
  db = cached;
} else {
  db = makeClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db;
  }
}

export { db };
