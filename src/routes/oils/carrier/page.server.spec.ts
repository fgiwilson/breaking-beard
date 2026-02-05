import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import {
	createTestDb,
	seedCarrierOil,
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

describe('Carrier oils load', () => {
	it('returns empty list when no oils exist', async () => {
		const { load } = await import('./+page.server');
		const result = await load({} as any);

		expect(result.oils).toEqual([]);
	});

	it('returns oils sorted by name', async () => {
		await seedCarrierOil(testDb, { name: 'Sweet Almond' });
		await seedCarrierOil(testDb, { name: 'Argan' });
		await seedCarrierOil(testDb, { name: 'Jojoba' });

		const { load } = await import('./+page.server');
		const result = await load({} as any);

		expect(result.oils.map((o: any) => o.name)).toEqual(['Argan', 'Jojoba', 'Sweet Almond']);
	});

	it('includes formulation count', async () => {
		const oil = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const formula = await seedFormulation(testDb, { name: 'Test' });
		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: oil.id, percentage: 100 }
		});

		const { load } = await import('./+page.server');
		const result = await load({} as any);

		expect(result.oils[0]._count.formulations).toBe(1);
	});
});

describe('Carrier oils create action', () => {
	it('creates a carrier oil with all fields', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({
				name: 'Jojoba',
				comedogenic: '2',
				absorption: 'fast',
				vitamins: 'E',
				texture: 'light',
				notes: 'Great for face'
			})
		} as any);

		expect(result).toEqual({ success: true });

		const oil = await testDb.carrierOil.findUnique({ where: { name: 'Jojoba' } });
		expect(oil).not.toBeNull();
		expect(oil!.comedogenic).toBe(2);
		expect(oil!.absorption).toBe('fast');
	});

	it('creates with only required name field', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({ name: 'Jojoba' })
		} as any);

		expect(result).toEqual({ success: true });
	});

	it('fails when name is missing', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
		expect((result as any).data.error).toBe('Name is required');
	});

	it('fails when name is only whitespace', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({ name: '   ' })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('fails on duplicate name (P2002)', async () => {
		await seedCarrierOil(testDb, { name: 'Jojoba' });

		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({ name: 'Jojoba' })
		} as any);

		expect(result).toHaveProperty('status', 400);
		expect((result as any).data.error).toBe('An oil with this name already exists');
	});
});

describe('Carrier oils update action', () => {
	it('updates an existing oil', async () => {
		const oil = await seedCarrierOil(testDb, { name: 'Jojoba', comedogenic: 2 });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({ id: oil.id, name: 'Jojoba Gold', comedogenic: '1' })
		} as any);

		expect(result).toEqual({ success: true });

		const updated = await testDb.carrierOil.findUnique({ where: { id: oil.id } });
		expect(updated!.name).toBe('Jojoba Gold');
		expect(updated!.comedogenic).toBe(1);
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({ name: 'Jojoba' })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('fails on duplicate name', async () => {
		await seedCarrierOil(testDb, { name: 'Jojoba' });
		const oil2 = await seedCarrierOil(testDb, { name: 'Argan' });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({ id: oil2.id, name: 'Jojoba' })
		} as any);

		expect(result).toHaveProperty('status', 400);
		expect((result as any).data.error).toBe('An oil with this name already exists');
	});
});

describe('Carrier oils delete action', () => {
	it('deletes an oil', async () => {
		const oil = await seedCarrierOil(testDb, { name: 'Jojoba' });

		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({ id: oil.id })
		} as any);

		expect(result).toEqual({ success: true });

		const found = await testDb.carrierOil.findUnique({ where: { id: oil.id } });
		expect(found).toBeNull();
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});
