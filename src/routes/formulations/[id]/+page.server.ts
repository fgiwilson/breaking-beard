import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const formulation = await db.formulation.findUnique({
		where: { id: params.id },
		include: {
			carrierOils: {
				include: { carrierOil: true }
			},
			essentialOils: {
				include: { essentialOil: true }
			},
			testLogs: {
				orderBy: { date: 'desc' }
			}
		}
	});

	if (!formulation) {
		error(404, 'Formula not found');
	}

	// Get all oils for editing
	const [carrierOils, essentialOils] = await Promise.all([
		db.carrierOil.findMany({ orderBy: { name: 'asc' } }),
		db.essentialOil.findMany({ orderBy: { name: 'asc' } })
	]);

	return { formulation, carrierOils, essentialOils };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const purpose = formData.get('purpose')?.toString();
		const status = formData.get('status')?.toString();
		const totalVolumeMl = formData.get('totalVolumeMl')?.toString();
		const notes = formData.get('notes')?.toString().trim();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		await db.formulation.update({
			where: { id: params.id },
			data: {
				name,
				purpose: purpose || null,
				status: status || 'not-tested',
				totalVolumeMl: totalVolumeMl ? parseFloat(totalVolumeMl) : null,
				notes: notes || null
			}
		});

		return { success: true };
	},

	addTestLog: async ({ request, params }) => {
		const formData = await request.formData();
		const notes = formData.get('notes')?.toString().trim();
		const rating = formData.get('rating')?.toString();

		if (!notes) {
			return fail(400, { error: 'Notes are required' });
		}

		await db.testLog.create({
			data: {
				formulationId: params.id,
				notes,
				rating: rating ? parseInt(rating) : null
			}
		});

		return { success: true };
	},

	deleteTestLog: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await db.testLog.delete({ where: { id } });

		return { success: true };
	},

	updateOils: async ({ request, params }) => {
		const formData = await request.formData();
		const carrierOils = JSON.parse(formData.get('carrierOils')?.toString() ?? '[]');
		const essentialOils = JSON.parse(formData.get('essentialOils')?.toString() ?? '[]');

		// Update carrier oils - delete existing and recreate
		await db.formulationCarrierOil.deleteMany({
			where: { formulationId: params.id }
		});

		if (carrierOils?.length) {
			await db.formulationCarrierOil.createMany({
				data: carrierOils.map((co: { id: string; percentage: number }) => ({
					formulationId: params.id,
					carrierOilId: co.id,
					percentage: co.percentage
				}))
			});
		}

		// Update essential oils - delete existing and recreate
		await db.formulationEssentialOil.deleteMany({
			where: { formulationId: params.id }
		});

		if (essentialOils?.length) {
			const formulation = await db.formulation.findUnique({
				where: { id: params.id },
				select: { totalVolumeMl: true }
			});

			await db.formulationEssentialOil.createMany({
				data: essentialOils
					.filter((eo: { drops: number }) => eo.drops > 0)
					.map((eo: { id: string; drops: number }) => ({
						formulationId: params.id,
						essentialOilId: eo.id,
						drops: eo.drops,
						percentage: formulation?.totalVolumeMl
							? ((eo.drops * 0.05) / formulation.totalVolumeMl) * 100
							: null
					}))
			});
		}

		// Touch the formulation to update updatedAt
		await db.formulation.update({
			where: { id: params.id },
			data: { updatedAt: new Date() }
		});

		return { success: true };
	},

	toggleMelissaApproved: async ({ params }) => {
		const formulation = await db.formulation.findUnique({
			where: { id: params.id },
			select: { melissaApproved: true }
		});

		if (!formulation) {
			return fail(404, { error: 'Formula not found' });
		}

		await db.formulation.update({
			where: { id: params.id },
			data: { melissaApproved: !formulation.melissaApproved }
		});

		return { success: true };
	},

	delete: async ({ params }) => {
		await db.formulation.delete({ where: { id: params.id } });
		return { success: true, redirect: '/formulations' };
	}
};
