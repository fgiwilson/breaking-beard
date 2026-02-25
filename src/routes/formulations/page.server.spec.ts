import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import {
	createTestDb,
	seedFormulation,
	seedCarrierOil,
	seedEssentialOil,
	seedTestLog,
	mockUrl
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

describe('Formulations list load', () => {
	it('returns empty list', async () => {
		const { load } = await import('./+page.server');
		const result = (await load({ url: mockUrl() } as any))!;

		expect(result.formulations).toEqual([]);
		expect(result.filter).toBeNull();
	});

	it('returns all formulations with includes', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, { name: 'Morning Blend', purpose: 'morning' });

		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: carrier.id, percentage: 100 }
		});
		await testDb.formulationEssentialOil.create({
			data: { formulationId: formula.id, essentialOilId: essential.id, drops: 3 }
		});
		await seedTestLog(testDb, formula.id);

		const { load } = await import('./+page.server');
		const result = (await load({ url: mockUrl() } as any))!;

		expect(result.formulations).toHaveLength(1);
		expect(result.formulations[0].carrierOils).toHaveLength(1);
		expect(result.formulations[0].essentialOils).toHaveLength(1);
		expect(result.formulations[0]._count.testLogs).toBe(1);
	});

	it('filters by purpose', async () => {
		await seedFormulation(testDb, { name: 'Morning', purpose: 'morning' });
		await seedFormulation(testDb, { name: 'Evening', purpose: 'evening' });

		const { load } = await import('./+page.server');
		const result = (await load({ url: mockUrl({ purpose: 'morning' }) } as any))!;

		expect(result.formulations).toHaveLength(1);
		expect(result.formulations[0].name).toBe('Morning');
		expect(result.filter).toBe('morning');
	});

	it('returns all when no purpose filter', async () => {
		await seedFormulation(testDb, { name: 'Morning', purpose: 'morning' });
		await seedFormulation(testDb, { name: 'Evening', purpose: 'evening' });

		const { load } = await import('./+page.server');
		const result = (await load({ url: mockUrl() } as any))!;

		expect(result.formulations).toHaveLength(2);
	});

	it('filters by status', async () => {
		await seedFormulation(testDb, { name: 'Untested' });
		const f2 = await seedFormulation(testDb, { name: 'Final' });
		await testDb.formulation.update({
			where: { id: f2.id },
			data: { status: 'final' }
		});

		const { load } = await import('./+page.server');
		const result = (await load({ url: mockUrl({ status: 'final' }) } as any))!;

		expect(result.formulations).toHaveLength(1);
		expect(result.formulations[0].name).toBe('Final');
		expect(result.statusFilter).toBe('final');
	});

	it('filters by melissaApproved', async () => {
		const approved = await seedFormulation(testDb, { name: 'Approved' });
		await testDb.formulation.update({
			where: { id: approved.id },
			data: { melissaApproved: true }
		});
		await seedFormulation(testDb, { name: 'Not Approved' });

		const { load } = await import('./+page.server');
		const result = (await load({ url: mockUrl({ melissaApproved: 'true' }) } as any))!;

		expect(result.formulations).toHaveLength(1);
		expect(result.formulations[0].name).toBe('Approved');
		expect(result.melissaFilter).toBe(true);
	});

	it('combines purpose, status, and melissaApproved filters', async () => {
		const match = await seedFormulation(testDb, { name: 'Match', purpose: 'morning' });
		await testDb.formulation.update({
			where: { id: match.id },
			data: { status: 'final', melissaApproved: true }
		});

		const noMatch1 = await seedFormulation(testDb, { name: 'Wrong Purpose', purpose: 'evening' });
		await testDb.formulation.update({
			where: { id: noMatch1.id },
			data: { status: 'final', melissaApproved: true }
		});

		const noMatch2 = await seedFormulation(testDb, {
			name: 'Wrong Status',
			purpose: 'morning'
		});
		await testDb.formulation.update({
			where: { id: noMatch2.id },
			data: { status: 'cottonball', melissaApproved: true }
		});

		const { load } = await import('./+page.server');
		const result = (await load({
			url: mockUrl({ purpose: 'morning', status: 'final', melissaApproved: 'true' })
		} as any))!;

		expect(result.formulations).toHaveLength(1);
		expect(result.formulations[0].name).toBe('Match');
	});

	it('orders by updatedAt descending', async () => {
		const f1 = await seedFormulation(testDb, { name: 'Older' });
		// Touch f1 to make it older by creating a newer one after
		const f2 = await seedFormulation(testDb, { name: 'Newer' });

		// Force different updatedAt by updating
		await testDb.formulation.update({
			where: { id: f1.id },
			data: { updatedAt: new Date('2024-01-01') }
		});
		await testDb.formulation.update({
			where: { id: f2.id },
			data: { updatedAt: new Date('2025-01-01') }
		});

		const { load } = await import('./+page.server');
		const result = (await load({ url: mockUrl() } as any))!;

		expect(result.formulations[0].name).toBe('Newer');
		expect(result.formulations[1].name).toBe('Older');
	});
});
