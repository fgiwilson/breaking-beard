import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import { createTestDb, seedWishlistItem, mockFormDataRequest } from '$lib/server/test-helpers';

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

describe('Wishlist load', () => {
	it('returns empty list when no items exist', async () => {
		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.items).toEqual([]);
	});

	it('sorts unpurchased before purchased', async () => {
		await seedWishlistItem(testDb, { name: 'Purchased', purchased: true });
		await seedWishlistItem(testDb, { name: 'Not Purchased', purchased: false });

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.items[0].name).toBe('Not Purchased');
		expect(result.items[1].name).toBe('Purchased');
	});

	it('sorts by priority descending within same purchased status', async () => {
		await seedWishlistItem(testDb, { name: 'Low', priority: 0 });
		await seedWishlistItem(testDb, { name: 'High', priority: 2 });
		await seedWishlistItem(testDb, { name: 'Medium', priority: 1 });

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.items.map((i: any) => i.name)).toEqual(['High', 'Medium', 'Low']);
	});

	it('sorts alphabetically within same priority', async () => {
		await seedWishlistItem(testDb, { name: 'Ylang Ylang', priority: 1 });
		await seedWishlistItem(testDb, { name: 'Clary Sage', priority: 1 });

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.items[0].name).toBe('Clary Sage');
		expect(result.items[1].name).toBe('Ylang Ylang');
	});
});

describe('Wishlist create action', () => {
	it('creates an item with all fields', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({
				name: 'Vetiver',
				scentCategory: 'earthy',
				notes: 'Deep grounding scent',
				priority: '2',
				purchaseUrl: 'https://example.com/vetiver'
			})
		} as any);

		expect(result).toEqual({ success: true });

		const items = await testDb.essentialOilWishlist.findMany();
		expect(items).toHaveLength(1);
		expect(items[0].name).toBe('Vetiver');
		expect(items[0].scentCategory).toBe('earthy');
		expect(items[0].priority).toBe(2);
		expect(items[0].purchaseUrl).toBe('https://example.com/vetiver');
	});

	it('creates with only required name', async () => {
		const { actions } = await import('./+page.server');
		await actions.create({
			request: mockFormDataRequest({ name: 'Vetiver' })
		} as any);

		const item = await testDb.essentialOilWishlist.findUnique({ where: { name: 'Vetiver' } });
		expect(item!.scentCategory).toBeNull();
		expect(item!.priority).toBe(0);
		expect(item!.purchased).toBe(false);
	});

	it('fails when name is missing', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('fails on duplicate name', async () => {
		await seedWishlistItem(testDb, { name: 'Vetiver' });

		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({ name: 'Vetiver' })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Wishlist update action', () => {
	it('updates an existing item', async () => {
		const item = await seedWishlistItem(testDb, { name: 'Vetiver', priority: 0 });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({
				id: item.id,
				name: 'Vetiver (Organic)',
				scentCategory: 'earthy',
				priority: '2',
				notes: 'Updated notes'
			})
		} as any);

		expect(result).toEqual({ success: true });

		const updated = await testDb.essentialOilWishlist.findUnique({ where: { id: item.id } });
		expect(updated!.name).toBe('Vetiver (Organic)');
		expect(updated!.priority).toBe(2);
		expect(updated!.notes).toBe('Updated notes');
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({ name: 'Test' })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('fails without name', async () => {
		const item = await seedWishlistItem(testDb, { name: 'Vetiver' });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({ id: item.id })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('fails on duplicate name', async () => {
		const item1 = await seedWishlistItem(testDb, { name: 'Vetiver' });
		await seedWishlistItem(testDb, { name: 'Patchouli' });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({ id: item1.id, name: 'Patchouli' })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Wishlist togglePurchased action', () => {
	it('toggles false to true', async () => {
		const item = await seedWishlistItem(testDb, { name: 'Vetiver', purchased: false });

		const { actions } = await import('./+page.server');
		const result = await actions.togglePurchased({
			request: mockFormDataRequest({ id: item.id })
		} as any);

		expect(result).toEqual({ success: true });

		const updated = await testDb.essentialOilWishlist.findUnique({ where: { id: item.id } });
		expect(updated!.purchased).toBe(true);
	});

	it('toggles true to false', async () => {
		const item = await seedWishlistItem(testDb, { name: 'Vetiver', purchased: true });

		const { actions } = await import('./+page.server');
		await actions.togglePurchased({
			request: mockFormDataRequest({ id: item.id })
		} as any);

		const updated = await testDb.essentialOilWishlist.findUnique({ where: { id: item.id } });
		expect(updated!.purchased).toBe(false);
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.togglePurchased({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});

	it('returns 404 for non-existent item', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.togglePurchased({
			request: mockFormDataRequest({ id: 'nonexistent' })
		} as any);

		expect(result).toHaveProperty('status', 404);
	});
});

describe('Wishlist delete action', () => {
	it('deletes an item', async () => {
		const item = await seedWishlistItem(testDb, { name: 'Vetiver' });

		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({ id: item.id })
		} as any);

		expect(result).toEqual({ success: true });
		expect(await testDb.essentialOilWishlist.findUnique({ where: { id: item.id } })).toBeNull();
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});
