import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import { createTestDb, seedCarrierOil, seedEssentialOil } from '$lib/server/test-helpers';

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

describe('New formulation load', () => {
	it('returns all oils for selection', async () => {
		await seedCarrierOil(testDb, { name: 'Jojoba' });
		await seedCarrierOil(testDb, { name: 'Sweet Almond' });
		await seedEssentialOil(testDb, { name: 'Bergamot' });
		await seedEssentialOil(testDb, { name: 'Lavender' });
		await seedEssentialOil(testDb, { name: 'Cypress' });

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.carrierOils).toHaveLength(2);
		expect(result.essentialOils).toHaveLength(3);
	});

	it('returns empty arrays when no oils exist', async () => {
		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.carrierOils).toEqual([]);
		expect(result.essentialOils).toEqual([]);
	});
});
