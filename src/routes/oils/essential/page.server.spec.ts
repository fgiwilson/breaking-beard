import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import {
	createTestDb,
	seedEssentialOil,
	seedFormulation,
	mockFormDataRequest
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

describe('Essential oils load', () => {
	it('returns empty list when no oils exist', async () => {
		const { load } = await import('./+page.server');
		const result = await load({} as any);

		expect(result.oils).toEqual([]);
	});

	it('returns oils sorted by name with pairings', async () => {
		const bergamot = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const cypress = await seedEssentialOil(testDb, { name: 'Cypress' });
		await testDb.essentialOilPairing.create({
			data: { oil1Id: bergamot.id, oil2Id: cypress.id, notes: 'Fresh combo' }
		});

		const { load } = await import('./+page.server');
		const result = await load({} as any);

		expect(result.oils).toHaveLength(2);
		expect(result.oils[0].name).toBe('Bergamot');
		expect(result.oils[0].pairings).toHaveLength(1);
		expect(result.oils[0].pairings[0].oil2.name).toBe('Cypress');
	});

	it('includes formulation count', async () => {
		const eo = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, { name: 'Test' });
		// Also need a carrier for formulation to make sense, but junction just needs IDs
		await testDb.formulationEssentialOil.create({
			data: { formulationId: formula.id, essentialOilId: eo.id, drops: 3 }
		});

		const { load } = await import('./+page.server');
		const result = await load({} as any);

		expect(result.oils[0]._count.formulations).toBe(1);
	});
});

describe('Essential oils create action', () => {
	it('creates with all fields', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({
				name: 'Bergamot',
				scentCategory: 'citrus',
				safetyNotes: 'phototoxic',
				minUsagePct: '0.5',
				maxUsagePct: '2.0',
				notes: 'Best oil'
			})
		} as any);

		expect(result).toEqual({ success: true });

		const oil = await testDb.essentialOil.findUnique({ where: { name: 'Bergamot' } });
		expect(oil!.scentCategory).toBe('citrus');
		expect(oil!.minUsagePct).toBe(0.5);
		expect(oil!.maxUsagePct).toBe(2.0);
	});

	it('fails when name is missing', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('fails on duplicate name', async () => {
		await seedEssentialOil(testDb, { name: 'Bergamot' });

		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({ name: 'Bergamot' })
		} as any);

		expect(result).toHaveProperty('status', 400);
		expect((result as any).data.error).toBe('An oil with this name already exists');
	});
});

describe('Essential oils update action', () => {
	it('updates an existing oil', async () => {
		const oil = await seedEssentialOil(testDb, { name: 'Bergamot', scentCategory: 'citrus' });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({
				id: oil.id,
				name: 'Bergamot FCF',
				scentCategory: 'citrus'
			})
		} as any);

		expect(result).toEqual({ success: true });

		const updated = await testDb.essentialOil.findUnique({ where: { id: oil.id } });
		expect(updated!.name).toBe('Bergamot FCF');
	});

	it('fails without id and name', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('fails on duplicate name', async () => {
		await seedEssentialOil(testDb, { name: 'Bergamot' });
		const oil2 = await seedEssentialOil(testDb, { name: 'Lavender' });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({ id: oil2.id, name: 'Bergamot' })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Essential oils delete action', () => {
	it('deletes an oil', async () => {
		const oil = await seedEssentialOil(testDb, { name: 'Bergamot' });

		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({ id: oil.id })
		} as any);

		expect(result).toEqual({ success: true });
		expect(await testDb.essentialOil.findUnique({ where: { id: oil.id } })).toBeNull();
	});

	it('cascade deletes pairings when oil is deleted', async () => {
		const oil1 = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const oil2 = await seedEssentialOil(testDb, { name: 'Cypress' });
		await testDb.essentialOilPairing.create({
			data: { oil1Id: oil1.id, oil2Id: oil2.id }
		});

		const { actions } = await import('./+page.server');
		await actions.delete({
			request: mockFormDataRequest({ id: oil1.id })
		} as any);

		const pairings = await testDb.essentialOilPairing.findMany();
		expect(pairings).toHaveLength(0);
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Essential oils addPairing action', () => {
	it('creates a pairing between two oils', async () => {
		const oil1 = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const oil2 = await seedEssentialOil(testDb, { name: 'Cypress' });

		const { actions } = await import('./+page.server');
		const result = await actions.addPairing({
			request: mockFormDataRequest({
				oil1Id: oil1.id,
				oil2Id: oil2.id,
				notes: 'Fresh and woody'
			})
		} as any);

		expect(result).toEqual({ success: true });

		const pairings = await testDb.essentialOilPairing.findMany();
		expect(pairings).toHaveLength(1);
		expect(pairings[0].notes).toBe('Fresh and woody');
	});

	it('normalizes ID order — smaller ID always first', async () => {
		const oil1 = await seedEssentialOil(testDb, { name: 'AAA' });
		const oil2 = await seedEssentialOil(testDb, { name: 'ZZZ' });

		// Pass the larger ID as oil1Id intentionally
		const [first, second] = oil1.id < oil2.id ? [oil2.id, oil1.id] : [oil1.id, oil2.id];

		const { actions } = await import('./+page.server');
		await actions.addPairing({
			request: mockFormDataRequest({ oil1Id: first, oil2Id: second })
		} as any);

		const pairing = await testDb.essentialOilPairing.findFirst();
		// The stored oil1Id should be the smaller of the two
		const expectedFirst = oil1.id < oil2.id ? oil1.id : oil2.id;
		expect(pairing!.oil1Id).toBe(expectedFirst);
	});

	it('rejects self-pairing', async () => {
		const oil = await seedEssentialOil(testDb, { name: 'Bergamot' });

		const { actions } = await import('./+page.server');
		const result = await actions.addPairing({
			request: mockFormDataRequest({ oil1Id: oil.id, oil2Id: oil.id })
		} as any);

		expect(result).toHaveProperty('status', 400);
		expect((result as any).data.error).toBe('Cannot pair an oil with itself');
	});

	it('rejects duplicate pairing (P2002)', async () => {
		const oil1 = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const oil2 = await seedEssentialOil(testDb, { name: 'Cypress' });

		const { actions } = await import('./+page.server');
		await actions.addPairing({
			request: mockFormDataRequest({ oil1Id: oil1.id, oil2Id: oil2.id })
		} as any);

		const result = await actions.addPairing({
			request: mockFormDataRequest({ oil1Id: oil1.id, oil2Id: oil2.id })
		} as any);

		expect(result).toHaveProperty('status', 400);
		expect((result as any).data.error).toBe('This pairing already exists');
	});

	it('fails when either oil is missing', async () => {
		const oil = await seedEssentialOil(testDb, { name: 'Bergamot' });

		const { actions } = await import('./+page.server');
		const result = await actions.addPairing({
			request: mockFormDataRequest({ oil1Id: oil.id })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Essential oils removePairing action', () => {
	it('removes a pairing', async () => {
		const oil1 = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const oil2 = await seedEssentialOil(testDb, { name: 'Cypress' });
		const pairing = await testDb.essentialOilPairing.create({
			data: { oil1Id: oil1.id, oil2Id: oil2.id }
		});

		const { actions } = await import('./+page.server');
		const result = await actions.removePairing({
			request: mockFormDataRequest({ id: pairing.id })
		} as any);

		expect(result).toEqual({ success: true });
		expect(await testDb.essentialOilPairing.findMany()).toHaveLength(0);
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.removePairing({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});
