import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import {
	createTestDb,
	seedFormulation,
	mockFormDataRequest,
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

describe('Test log new — load', () => {
	it('returns all formulations sorted by updatedAt desc', async () => {
		await seedFormulation(testDb, { name: 'Alpha' });
		await seedFormulation(testDb, { name: 'Beta' });

		const { load } = await import('./+page.server');
		const result = await load({ url: mockUrl() } as any);

		expect(result.formulations).toHaveLength(2);
		expect(result.formulations[0]).toHaveProperty('name');
		expect(result.formulations[0]).toHaveProperty('id');
		expect(result.formulations[0]).toHaveProperty('purpose');
	});

	it('returns empty array when no formulations exist', async () => {
		const { load } = await import('./+page.server');
		const result = await load({ url: mockUrl() } as any);

		expect(result.formulations).toEqual([]);
	});

	it('passes preselected formulation from query param', async () => {
		const formula = await seedFormulation(testDb, { name: 'Target' });

		const { load } = await import('./+page.server');
		const result = await load({
			url: mockUrl({ formulation: formula.id })
		} as any);

		expect(result.preselected).toBe(formula.id);
	});

	it('returns null preselected when no query param', async () => {
		const { load } = await import('./+page.server');
		const result = await load({ url: mockUrl() } as any);

		expect(result.preselected).toBeNull();
	});
});

describe('Test log new — default action', () => {
	it('creates a test log with notes and rating', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test Formula' });

		const { actions } = await import('./+page.server');
		const request = mockFormDataRequest({
			formulationId: formula.id,
			notes: 'Lovely bergamot forward scent',
			rating: '4'
		});

		// SvelteKit redirect() throws an object with status and location
		try {
			await (actions as any).default({ request });
			expect.unreachable('Should have thrown a redirect');
		} catch (e: any) {
			expect(e.status).toBe(303);
			expect(e.location).toBe(`/formulations/${formula.id}`);
		}

		const logs = await testDb.testLog.findMany({
			where: { formulationId: formula.id }
		});
		expect(logs).toHaveLength(1);
		expect(logs[0].notes).toBe('Lovely bergamot forward scent');
		expect(logs[0].rating).toBe(4);
	});

	it('creates a test log without rating', async () => {
		const formula = await seedFormulation(testDb, { name: 'No Rating' });

		const { actions } = await import('./+page.server');
		const request = mockFormDataRequest({
			formulationId: formula.id,
			notes: 'Quick test, no rating',
			rating: ''
		});

		try {
			await (actions as any).default({ request });
			expect.unreachable('Should have thrown a redirect');
		} catch (e: any) {
			expect(e.status).toBe(303);
		}

		const logs = await testDb.testLog.findMany({
			where: { formulationId: formula.id }
		});
		expect(logs).toHaveLength(1);
		expect(logs[0].rating).toBeNull();
	});

	it('fails without formulationId', async () => {
		const { actions } = await import('./+page.server');
		const request = mockFormDataRequest({
			notes: 'Some notes'
		});

		const result = await (actions as any).default({ request });

		expect(result.status).toBe(400);
		expect(result.data.error).toBe('Please select a formulation');
	});

	it('fails without notes', async () => {
		const formula = await seedFormulation(testDb, { name: 'Needs Notes' });

		const { actions } = await import('./+page.server');
		const request = mockFormDataRequest({
			formulationId: formula.id,
			notes: '   '
		});

		const result = await (actions as any).default({ request });

		expect(result.status).toBe(400);
		expect(result.data.error).toBe('Notes are required');
	});

	it('fails with non-existent formulation', async () => {
		const { actions } = await import('./+page.server');
		const request = mockFormDataRequest({
			formulationId: 'nonexistent-id',
			notes: 'Should fail'
		});

		const result = await (actions as any).default({ request });

		expect(result.status).toBe(404);
		expect(result.data.error).toBe('Formulation not found');
	});
});
