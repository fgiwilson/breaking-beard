import { PrismaClient } from './generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const MIGRATION_SQL = `
CREATE TABLE "CarrierOil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "comedogenic" INTEGER,
    "absorption" TEXT,
    "vitamins" TEXT,
    "texture" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "EssentialOil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scentCategory" TEXT,
    "safetyNotes" TEXT,
    "minUsagePct" REAL,
    "maxUsagePct" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "EssentialOilPairing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oil1Id" TEXT NOT NULL,
    "oil2Id" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EssentialOilPairing_oil1Id_fkey" FOREIGN KEY ("oil1Id") REFERENCES "EssentialOil" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EssentialOilPairing_oil2Id_fkey" FOREIGN KEY ("oil2Id") REFERENCES "EssentialOil" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Formulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "totalVolumeMl" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "FormulationCarrierOil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulationId" TEXT NOT NULL,
    "carrierOilId" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    CONSTRAINT "FormulationCarrierOil_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormulationCarrierOil_carrierOilId_fkey" FOREIGN KEY ("carrierOilId") REFERENCES "CarrierOil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "FormulationEssentialOil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulationId" TEXT NOT NULL,
    "essentialOilId" TEXT NOT NULL,
    "drops" INTEGER,
    "percentage" REAL,
    CONSTRAINT "FormulationEssentialOil_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormulationEssentialOil_essentialOilId_fkey" FOREIGN KEY ("essentialOilId") REFERENCES "EssentialOil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "TestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestLog_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "CarrierOil_name_key" ON "CarrierOil"("name");
CREATE UNIQUE INDEX "EssentialOil_name_key" ON "EssentialOil"("name");
CREATE UNIQUE INDEX "EssentialOilPairing_oil1Id_oil2Id_key" ON "EssentialOilPairing"("oil1Id", "oil2Id");
CREATE UNIQUE INDEX "FormulationCarrierOil_formulationId_carrierOilId_key" ON "FormulationCarrierOil"("formulationId", "carrierOilId");
CREATE UNIQUE INDEX "FormulationEssentialOil_formulationId_essentialOilId_key" ON "FormulationEssentialOil"("formulationId", "essentialOilId");
CREATE INDEX "TestLog_formulationId_date_idx" ON "TestLog"("formulationId", "date");
`;

export async function createTestDb(): Promise<PrismaClient> {
	const adapter = new PrismaBetterSqlite3({ url: ':memory:' });
	const prisma = new PrismaClient({ adapter });

	// Apply schema — split on semicolons and run each statement
	const statements = MIGRATION_SQL.split(';')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	for (const stmt of statements) {
		await prisma.$executeRawUnsafe(stmt);
	}

	return prisma;
}

// ── Seed Factories ────────────────────────────────────────────

export async function seedCarrierOil(
	db: PrismaClient,
	overrides: Partial<{
		name: string;
		comedogenic: number;
		absorption: string;
		vitamins: string;
		texture: string;
		notes: string;
	}> = {}
) {
	return db.carrierOil.create({
		data: {
			name: overrides.name ?? `Carrier ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			comedogenic: overrides.comedogenic ?? null,
			absorption: overrides.absorption ?? null,
			vitamins: overrides.vitamins ?? null,
			texture: overrides.texture ?? null,
			notes: overrides.notes ?? null
		}
	});
}

export async function seedEssentialOil(
	db: PrismaClient,
	overrides: Partial<{
		name: string;
		scentCategory: string;
		safetyNotes: string;
		minUsagePct: number;
		maxUsagePct: number;
		notes: string;
	}> = {}
) {
	return db.essentialOil.create({
		data: {
			name:
				overrides.name ?? `Essential ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			scentCategory: overrides.scentCategory ?? null,
			safetyNotes: overrides.safetyNotes ?? null,
			minUsagePct: overrides.minUsagePct ?? null,
			maxUsagePct: overrides.maxUsagePct ?? null,
			notes: overrides.notes ?? null
		}
	});
}

export async function seedFormulation(
	db: PrismaClient,
	overrides: Partial<{
		name: string;
		purpose: string;
		totalVolumeMl: number;
		notes: string;
	}> = {}
) {
	return db.formulation.create({
		data: {
			name:
				overrides.name ?? `Formula ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			purpose: overrides.purpose ?? null,
			totalVolumeMl: overrides.totalVolumeMl ?? null,
			notes: overrides.notes ?? null
		}
	});
}

export async function seedTestLog(
	db: PrismaClient,
	formulationId: string,
	overrides: Partial<{ notes: string; rating: number }> = {}
) {
	return db.testLog.create({
		data: {
			formulationId,
			notes: overrides.notes ?? 'Test log notes',
			rating: overrides.rating ?? null
		}
	});
}

export async function seedDiaryEntry(
	db: PrismaClient,
	overrides: Partial<{ title: string; content: string }> = {}
) {
	return db.diaryEntry.create({
		data: {
			content: overrides.content ?? 'Diary content',
			title: overrides.title ?? null
		}
	});
}

// ── Mock Factories ────────────────────────────────────────────

export function mockFormDataRequest(fields: Record<string, string>): Request {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.append(key, value);
	}
	return new Request('http://test', { method: 'POST', body: formData });
}

export function mockJsonRequest(body: unknown): Request {
	return new Request('http://test', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

export function mockUrl(params?: Record<string, string>): URL {
	const url = new URL('http://test');
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
	}
	return url;
}
