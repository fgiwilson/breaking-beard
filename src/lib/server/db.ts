import { PrismaClient } from './generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '$env/dynamic/private';

const dbUrl = env.DATABASE_URL ?? 'file:dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter
	});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
