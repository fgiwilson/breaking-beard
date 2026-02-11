import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import {
	createTestDb,
	seedFormulation,
	seedCarrierOil,
	seedEssentialOil,
	seedTestLog,
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

describe('Formulation detail load', () => {
	it('loads a formulation with all relations', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, {
			name: 'Morning Blend',
			purpose: 'morning',
			totalVolumeMl: 30
		});

		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: carrier.id, percentage: 100 }
		});
		await testDb.formulationEssentialOil.create({
			data: {
				formulationId: formula.id,
				essentialOilId: essential.id,
				drops: 3,
				percentage: 0.5
			}
		});
		await seedTestLog(testDb, formula.id, { notes: 'Smells great', rating: 4 });

		const { load } = await import('./+page.server');
		const result = (await load({ params: { id: formula.id } } as any))!;

		expect(result.formulation.name).toBe('Morning Blend');
		expect(result.formulation.carrierOils).toHaveLength(1);
		expect(result.formulation.essentialOils).toHaveLength(1);
		expect(result.formulation.testLogs).toHaveLength(1);
		expect(result.formulation.testLogs[0].rating).toBe(4);
		// Also returns all oils for editing
		expect(result.carrierOils).toHaveLength(1);
		expect(result.essentialOils).toHaveLength(1);
	});

	it('throws 404 for non-existent formulation', async () => {
		const { load } = await import('./+page.server');

		await expect(load({ params: { id: 'nonexistent' } } as any)).rejects.toThrow();
	});

	it('returns test logs ordered by date descending', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });
		await testDb.testLog.create({
			data: { formulationId: formula.id, notes: 'Old', date: new Date('2024-01-01') }
		});
		await testDb.testLog.create({
			data: { formulationId: formula.id, notes: 'New', date: new Date('2025-06-01') }
		});

		const { load } = await import('./+page.server');
		const result = (await load({ params: { id: formula.id } } as any))!;

		expect(result.formulation.testLogs[0].notes).toBe('New');
		expect(result.formulation.testLogs[1].notes).toBe('Old');
	});
});

describe('Formulation update action', () => {
	it('updates formulation fields', async () => {
		const formula = await seedFormulation(testDb, { name: 'Old Name', purpose: 'morning' });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({
				name: 'New Name',
				purpose: 'evening',
				totalVolumeMl: '30',
				notes: 'Updated notes'
			}),
			params: { id: formula.id }
		} as any);

		expect(result).toEqual({ success: true });

		const updated = await testDb.formulation.findUnique({ where: { id: formula.id } });
		expect(updated!.name).toBe('New Name');
		expect(updated!.purpose).toBe('evening');
		expect(updated!.totalVolumeMl).toBe(30);
	});

	it('updates status field', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });

		const { actions } = await import('./+page.server');
		await actions.update({
			request: mockFormDataRequest({
				name: 'Test',
				status: 'cottonball'
			}),
			params: { id: formula.id }
		} as any);

		const updated = await testDb.formulation.findUnique({ where: { id: formula.id } });
		expect(updated!.status).toBe('cottonball');
	});

	it('defaults status to not-tested when empty', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });
		await testDb.formulation.update({
			where: { id: formula.id },
			data: { status: 'final' }
		});

		const { actions } = await import('./+page.server');
		await actions.update({
			request: mockFormDataRequest({ name: 'Test', status: '' }),
			params: { id: formula.id }
		} as any);

		const updated = await testDb.formulation.findUnique({ where: { id: formula.id } });
		expect(updated!.status).toBe('not-tested');
	});

	it('fails when name is missing', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });

		const { actions } = await import('./+page.server');
		const result = await actions.update({
			request: mockFormDataRequest({}),
			params: { id: formula.id }
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Formulation toggleMelissaApproved action', () => {
	it('flips false to true', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });

		const { actions } = await import('./+page.server');
		const result = await actions.toggleMelissaApproved({
			params: { id: formula.id }
		} as any);

		expect(result).toEqual({ success: true });

		const updated = await testDb.formulation.findUnique({ where: { id: formula.id } });
		expect(updated!.melissaApproved).toBe(true);
	});

	it('flips true to false', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });
		await testDb.formulation.update({
			where: { id: formula.id },
			data: { melissaApproved: true }
		});

		const { actions } = await import('./+page.server');
		await actions.toggleMelissaApproved({
			params: { id: formula.id }
		} as any);

		const updated = await testDb.formulation.findUnique({ where: { id: formula.id } });
		expect(updated!.melissaApproved).toBe(false);
	});

	it('returns 404 for non-existent formulation', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.toggleMelissaApproved({
			params: { id: 'nonexistent' }
		} as any);

		expect(result).toHaveProperty('status', 404);
	});
});

describe('Formulation addTestLog action', () => {
	it('creates a test log with rating', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });

		const { actions } = await import('./+page.server');
		const result = await actions.addTestLog({
			request: mockFormDataRequest({ notes: 'Great scent', rating: '5' }),
			params: { id: formula.id }
		} as any);

		expect(result).toEqual({ success: true });

		const logs = await testDb.testLog.findMany({ where: { formulationId: formula.id } });
		expect(logs).toHaveLength(1);
		expect(logs[0].notes).toBe('Great scent');
		expect(logs[0].rating).toBe(5);
	});

	it('creates a test log without rating', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });

		const { actions } = await import('./+page.server');
		await actions.addTestLog({
			request: mockFormDataRequest({ notes: 'No rating' }),
			params: { id: formula.id }
		} as any);

		const logs = await testDb.testLog.findMany({ where: { formulationId: formula.id } });
		expect(logs[0].rating).toBeNull();
	});

	it('fails when notes are missing', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });

		const { actions } = await import('./+page.server');
		const result = await actions.addTestLog({
			request: mockFormDataRequest({}),
			params: { id: formula.id }
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Formulation deleteTestLog action', () => {
	it('deletes a test log', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });
		const log = await seedTestLog(testDb, formula.id);

		const { actions } = await import('./+page.server');
		const result = await actions.deleteTestLog({
			request: mockFormDataRequest({ id: log.id })
		} as any);

		expect(result).toEqual({ success: true });
		expect(await testDb.testLog.findUnique({ where: { id: log.id } })).toBeNull();
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.deleteTestLog({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Formulation updateOils action', () => {
	it('replaces carrier oils', async () => {
		const carrier1 = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const carrier2 = await seedCarrierOil(testDb, { name: 'Sweet Almond' });
		const formula = await seedFormulation(testDb, { name: 'Test', totalVolumeMl: 30 });

		// Start with carrier1
		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: carrier1.id, percentage: 100 }
		});

		const { actions } = await import('./+page.server');
		// Replace with carrier2
		await actions.updateOils({
			request: mockFormDataRequest({
				carrierOils: JSON.stringify([{ id: carrier2.id, percentage: 70 }]),
				essentialOils: JSON.stringify([])
			}),
			params: { id: formula.id }
		} as any);

		const carriers = await testDb.formulationCarrierOil.findMany({
			where: { formulationId: formula.id }
		});
		expect(carriers).toHaveLength(1);
		expect(carriers[0].carrierOilId).toBe(carrier2.id);
		expect(carriers[0].percentage).toBe(70);
	});

	it('calculates EO percentage from drops and totalVolumeMl', async () => {
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, { name: 'Test', totalVolumeMl: 30 });

		const { actions } = await import('./+page.server');
		await actions.updateOils({
			request: mockFormDataRequest({
				carrierOils: JSON.stringify([]),
				essentialOils: JSON.stringify([{ id: essential.id, drops: 6 }])
			}),
			params: { id: formula.id }
		} as any);

		const eos = await testDb.formulationEssentialOil.findMany({
			where: { formulationId: formula.id }
		});
		expect(eos).toHaveLength(1);
		expect(eos[0].drops).toBe(6);
		// Formula: (6 * 0.05 / 30) * 100 = 1.0
		expect(eos[0].percentage).toBeCloseTo(1.0);
	});

	it('sets percentage to null when totalVolumeMl is not set', async () => {
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, { name: 'Test' }); // no totalVolumeMl

		const { actions } = await import('./+page.server');
		await actions.updateOils({
			request: mockFormDataRequest({
				carrierOils: JSON.stringify([]),
				essentialOils: JSON.stringify([{ id: essential.id, drops: 6 }])
			}),
			params: { id: formula.id }
		} as any);

		const eos = await testDb.formulationEssentialOil.findMany({
			where: { formulationId: formula.id }
		});
		expect(eos[0].percentage).toBeNull();
	});

	it('filters out zero-drop essential oils', async () => {
		const eo1 = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const eo2 = await seedEssentialOil(testDb, { name: 'Lavender' });
		const formula = await seedFormulation(testDb, { name: 'Test', totalVolumeMl: 30 });

		const { actions } = await import('./+page.server');
		await actions.updateOils({
			request: mockFormDataRequest({
				carrierOils: JSON.stringify([]),
				essentialOils: JSON.stringify([
					{ id: eo1.id, drops: 3 },
					{ id: eo2.id, drops: 0 } // should be filtered out
				])
			}),
			params: { id: formula.id }
		} as any);

		const eos = await testDb.formulationEssentialOil.findMany({
			where: { formulationId: formula.id }
		});
		expect(eos).toHaveLength(1);
		expect(eos[0].essentialOilId).toBe(eo1.id);
	});

	it('clears all oils when given empty arrays', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, { name: 'Test', totalVolumeMl: 30 });

		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: carrier.id, percentage: 100 }
		});
		await testDb.formulationEssentialOil.create({
			data: { formulationId: formula.id, essentialOilId: essential.id, drops: 3 }
		});

		const { actions } = await import('./+page.server');
		await actions.updateOils({
			request: mockFormDataRequest({
				carrierOils: JSON.stringify([]),
				essentialOils: JSON.stringify([])
			}),
			params: { id: formula.id }
		} as any);

		const carriers = await testDb.formulationCarrierOil.findMany({
			where: { formulationId: formula.id }
		});
		const eos = await testDb.formulationEssentialOil.findMany({
			where: { formulationId: formula.id }
		});
		expect(carriers).toHaveLength(0);
		expect(eos).toHaveLength(0);
	});

	it('touches updatedAt on the formulation', async () => {
		const formula = await seedFormulation(testDb, { name: 'Test' });
		const originalUpdatedAt = formula.updatedAt;

		// Small delay to ensure different timestamp
		await new Promise((r) => setTimeout(r, 10));

		const { actions } = await import('./+page.server');
		await actions.updateOils({
			request: mockFormDataRequest({
				carrierOils: JSON.stringify([]),
				essentialOils: JSON.stringify([])
			}),
			params: { id: formula.id }
		} as any);

		const updated = await testDb.formulation.findUnique({ where: { id: formula.id } });
		expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
	});
});

describe('Formulation delete action', () => {
	it('deletes the formulation and cascades', async () => {
		const carrier = await seedCarrierOil(testDb, { name: 'Jojoba' });
		const essential = await seedEssentialOil(testDb, { name: 'Bergamot' });
		const formula = await seedFormulation(testDb, { name: 'To Delete', totalVolumeMl: 30 });

		await testDb.formulationCarrierOil.create({
			data: { formulationId: formula.id, carrierOilId: carrier.id, percentage: 100 }
		});
		await testDb.formulationEssentialOil.create({
			data: { formulationId: formula.id, essentialOilId: essential.id, drops: 3 }
		});
		await seedTestLog(testDb, formula.id);

		const { actions } = await import('./+page.server');
		const result = await actions.delete({ params: { id: formula.id } } as any);

		expect(result).toEqual({ success: true, redirect: '/formulations' });

		// Formulation is gone
		expect(await testDb.formulation.findUnique({ where: { id: formula.id } })).toBeNull();
		// Junction records are cascaded
		expect(
			await testDb.formulationCarrierOil.findMany({ where: { formulationId: formula.id } })
		).toHaveLength(0);
		expect(
			await testDb.formulationEssentialOil.findMany({ where: { formulationId: formula.id } })
		).toHaveLength(0);
		expect(await testDb.testLog.findMany({ where: { formulationId: formula.id } })).toHaveLength(0);

		// But the oils themselves still exist
		expect(await testDb.carrierOil.findUnique({ where: { id: carrier.id } })).not.toBeNull();
		expect(await testDb.essentialOil.findUnique({ where: { id: essential.id } })).not.toBeNull();
	});
});
