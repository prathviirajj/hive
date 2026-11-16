import { PrismaClient } from '@prisma/client'
import { createRequire } from 'node:module'
import * as fs from 'node:fs'
import * as path from 'node:path'

const nodeRequire = createRequire(import.meta.url);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In Next.js dev mode with Turbopack, the @prisma/client module can be cached
// in-memory with an OLD schema (before new models were added via prisma generate).
// We detect this by probing for a known recent model (qmsUser) and, if missing,
// we re-evaluate the actual .prisma/client/index.js file to get a fresh class
// that includes all current models.
function loadFreshPrismaClient(): any {
  try {
    const probe = new PrismaClient({ log: [] } as any);
    const models = (probe as any)._runtimeDataModel?.models || {};
    if ('QmsUser' in models) return PrismaClient;
  } catch {}

  // Stale cache - load the actual .prisma/client/index.js file fresh
  try {
    const prismaClientPath = path.resolve(process.cwd(), 'node_modules/.prisma/client/index.js');
    const content = fs.readFileSync(prismaClientPath, 'utf-8');
    const moduleObj: any = { exports: {} };
    const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', content);
    fn(moduleObj, moduleObj.exports, nodeRequire, path.dirname(prismaClientPath), prismaClientPath);
    return moduleObj.exports.PrismaClient;
  } catch (e) {
    console.error('[db.ts] Failed to load fresh PrismaClient:', e);
    return PrismaClient;
  }
}

const FreshClient = loadFreshPrismaClient();

function makeClient() {
  return new FreshClient({ log: ['query'] } as any);
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
