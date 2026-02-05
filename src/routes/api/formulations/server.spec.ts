import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import {
	createTestDb,
	seedCarrierOil,
	seedEssentialOil,
	seedFormulation,
	seedTestLog,
	mockJsonRequest,
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

describe('POST /api/formulations', () => {
	it('creates a formulation with carrier and essential oils', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });

		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: 'Morning Blend',
				purpose: 'morning',
				totalVolumeMl: 30,
				notes: 'Citrus forward',
				carrierOils: [{ id: carrier.id, percentage: 100 }],
				essentialOils: [{ id: essential.id, drops: 6 }]
			})
		} as any);

		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.id).toBeDefined();

		// Verify in database
		const formula = await testDb.formulation.findUnique({
			where: { id: body.id },
			include: { carrierOils: true, essentialOils: true }
		});
		expect(formula!.name).toBe('Morning Blend');
		expect(formula!.carrierOils).toHaveLength(1);
		expect(formula!.essentialOils).toHaveLength(1);
	});

	it('calculates EO percentage from drops and totalVolumeMl', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });

		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: 'Test',
				totalVolumeMl: 30,
				carrierOils: [{ id: carrier.id, percentage: 100 }],
				essentialOils: [{ id: essential.id, drops: 6 }]
			})
		} as any);

		const body = await response.json();
		const eos = await testDb.formulationEssentialOil.findMany({
			where: { formulationId: body.id }
		});

		// (6 * 0.05 / 30) * 100 = 1.0%
		expect(eos[0].percentage).toBeCloseTo(1.0);
	});

	it('sets percentage to null when no totalVolumeMl', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });

		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: 'Test',
				carrierOils: [{ id: carrier.id, percentage: 100 }],
				essentialOils: [{ id: essential.id, drops: 3 }]
			})
		} as any);

		const body = await response.json();
		const eos = await testDb.formulationEssentialOil.findMany({
			where: { formulationId: body.id }
		});
		expect(eos[0].percentage).toBeNull();
	});

	it('filters out zero-drop essential oils', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const eo1 = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const eo2 = await seedEssentialOil(testDb, { name: 'Lavender' });

		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: 'Test',
				totalVolumeMl: 30,
				carrierOils: [{ id: carrier.id, percentage: 100 }],
				essentialOils: [
					{ id: eo1.id, drops: 3 },
					{ id: eo2.id, drops: 0 }
				]
			})
		} as any);

		const body = await response.json();
		const eos = await testDb.formulationEssentialOil.findMany({
			where: { formulationId: body.id }
		});
		expect(eos).toHaveLength(1);
	});

	it('creates without essential oils', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });

		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: 'Carrier Only',
				carrierOils: [{ id: carrier.id, percentage: 100 }]
			})
		} as any);

		expect(response.status).toBe(201);
	});

	it('trims the name', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });

		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: '  Trimmed Name  ',
				carrierOils: [{ id: carrier.id, percentage: 100 }]
			})
		} as any);

		const body = await response.json();
		const formula = await testDb.formulation.findUnique({ where: { id: body.id } });
		expect(formula!.name).toBe('Trimmed Name');
	});

	it('returns 400 when name is missing', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				carrierOils: [{ id: 'any', percentage: 100 }]
			})
		} as any);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe('Name is required');
	});

	it('returns 400 when name is whitespace', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: '   ',
				carrierOils: [{ id: 'any', percentage: 100 }]
			})
		} as any);

		expect(response.status).toBe(400);
	});

	it('returns 400 when no carrier oils', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({
				name: 'No Carriers',
				carrierOils: []
			})
		} as any);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe('At least one carrier oil is required');
	});

	it('returns 400 when carrier oils are undefined', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({ name: 'No Carriers' })
		} as any);

		expect(response.status).toBe(400);
	});
});

describe('GET /api/formulations', () => {
	it('returns all formulations with includes', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const formula = await seedFormulation(testDb, { name: 'Test' });
		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: carrier.id, percentage: 100 }
		});
		await seedTestLog(testDb, formula.id);

		const { GET } = await import('./+server');
		const response = await GET({ url: mockUrl() } as any);
		const body = await response.json();

		expect(body).toHaveLength(1);
		expect(body[0].carrierOils).toHaveLength(1);
		expect(body[0]._count.testLogs).toBe(1);
	});

	it('filters by purpose', async () => {
		await seedFormulation(testDb, { name: 'Morning', purpose: 'morning' });
		await seedFormulation(testDb, { name: 'Evening', purpose: 'evening' });

		const { GET } = await import('./+server');
		const response = await GET({ url: mockUrl({ purpose: 'morning' }) } as any);
		const body = await response.json();

		expect(body).toHaveLength(1);
		expect(body[0].name).toBe('Morning');
	});

	it('returns empty array when no formulations', async () => {
		const { GET } = await import('./+server');
		const response = await GET({ url: mockUrl() } as any);
		const body = await response.json();

		expect(body).toEqual([]);
	});
});
