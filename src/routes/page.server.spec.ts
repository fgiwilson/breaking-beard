import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import {
	createTestDb,
	seedCarrierOil,
	seedEssentialOil,
	seedFormulation,
	seedTestLog,
	seedDiaryEntry
} from '$lib/server/test-helpers';

let testDb: PrismaClient;

vi.mock('$lib/server/db', () => ({
	get db() {
		return testDb;
	}
}));

beforeEach(async () => {
	testDb = await createTestDb();
});

afterEach(async () => {
	await testDb.$disconnect();
});

describe('Dashboard load', () => {
	it('returns empty state when database is empty', async () => {
		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.formulations).toEqual([]);
		expect(result.recentTestLogs).toEqual([]);
		expect(result.stats).toEqual({ carrierOils: 0, essentialOils: 0, formulations: 0 });
		expect(result.diaryEntries).toEqual([]);
	});

	it('returns carrier oil count', async () => {
		await seedCarrierOil(testDb, { name: 'Jojoba' });
		await seedCarrierOil(testDb, { name: 'Sweet Almond' });

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.stats.carrierOils).toBe(2);
	});

	it('returns essential oil count', async () => {
		await seedEssentialOil(testDb, { name: 'Bergamot' });
		await seedEssentialOil(testDb, { name: 'Lavender' });
		await seedEssentialOil(testDb, { name: 'Cypress' });

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.stats.essentialOils).toBe(3);
	});

	it('limits formulations to 5', async () => {
		for (let i = 0; i < 7; i++) {
			await seedFormulation(testDb, { name: `Formula ${i}` });
		}

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.formulations).toHaveLength(5);
	});

	it('stats.formulations reflects take:5 cap, not total count', async () => {
		for (let i = 0; i < 7; i++) {
			await seedFormulation(testDb, { name: `Formula ${i}` });
		}

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		// This documents the current behavior: stats.formulations uses
		// formulations.length (capped at 5) rather than a separate count query
		expect(result.stats.formulations).toBe(5);
	});

	it('limits recent test logs to 5', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test Formula' });
		for (let i = 0; i < 7; i++) {
			await seedTestLog(testDb, formula.id, { notes: `Log ${i}` });
		}

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.recentTestLogs).toHaveLength(5);
	});

	it('limits diary entries to 3', async () => {
		for (let i = 0; i < 5; i++) {
			await seedDiaryEntry(testDb, { content: `Entry ${i}` });
		}

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.diaryEntries).toHaveLength(3);
	});

	it('includes essentialOils and carrierOils in formulations', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, { name: 'Morning Blend' });

		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: carrier.id, percentage: 80 }
		});
		await testDb.formulationEssentialOil.create({
			data: { formulationId: formula.id, essentialOilId: essential.id, drops: 3, percentage: 0.5 }
		});

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.formulations[0].carrierOils).toHaveLength(1);
		expect(result.formulations[0].carrierOils[0].carrierOil.name).toBe('Jojoba');
		expect(result.formulations[0].essentialOils).toHaveLength(1);
		expect(result.formulations[0].essentialOils[0].essentialOil.name).toBe('Bergamot');
		expect(result.formulations[0]._count.testLogs).toBe(0);
	});
});
