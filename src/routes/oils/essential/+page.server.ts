import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const oils = await db.essentialOil.findMany({
		orderBy: { name: 'asc' },
		include: {
			_count: { select: { formulations: true } },
			pairings: {
				include: { oil2: true }
			},
			pairedWith: {
				include: { oil1: true }
			}
		}
	});

	return { oils };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const scentCategory = formData.get('scentCategory')?.toString();
		const safetyNotes = formData.get('safetyNotes')?.toString().trim();
		const minDrops = formData.get('minDrops')?.toString();
		const maxDrops = formData.get('maxDrops')?.toString();
		const notes = formData.get('notes')?.toString().trim();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		try {
			await db.essentialOil.create({
				data: {
					name,
					scentCategory: scentCategory || null,
					safetyNotes: safetyNotes || null,
					minDrops: minDrops ? parseInt(minDrops) : null,
					maxDrops: maxDrops ? parseInt(maxDrops) : null,
					notes: notes || null
				}
			});
		} catch (e) {
			if ((e as { code?: string }).code === 'P2002') {
				return fail(400, { error: 'An oil with this name already exists' });
			}
			throw e;
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const name = formData.get('name')?.toString().trim();
		const scentCategory = formData.get('scentCategory')?.toString();
		const safetyNotes = formData.get('safetyNotes')?.toString().trim();
		const minDrops = formData.get('minDrops')?.toString();
		const maxDrops = formData.get('maxDrops')?.toString();
		const notes = formData.get('notes')?.toString().trim();

		if (!id || !name) {
			return fail(400, { error: 'ID and name are required' });
		}

		try {
			await db.essentialOil.update({
				where: { id },
				data: {
					name,
					scentCategory: scentCategory || null,
					safetyNotes: safetyNotes || null,
					minDrops: minDrops ? parseInt(minDrops) : null,
					maxDrops: maxDrops ? parseInt(maxDrops) : null,
					notes: notes || null
				}
			});
		} catch (e) {
			if ((e as { code?: string }).code === 'P2002') {
				return fail(400, { error: 'An oil with this name already exists' });
			}
			throw e;
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await db.essentialOil.delete({ where: { id } });

		return { success: true };
	},

	addPairing: async ({ request }) => {
		const formData = await request.formData();
		const oil1Id = formData.get('oil1Id')?.toString();
		const oil2Id = formData.get('oil2Id')?.toString();
		const notes = formData.get('notes')?.toString().trim();

		if (!oil1Id || !oil2Id) {
			return fail(400, { error: 'Both oils are required' });
		}

		if (oil1Id === oil2Id) {
			return fail(400, { error: 'Cannot pair an oil with itself' });
		}

		// Always store with smaller ID first for consistency
		const [first, second] = oil1Id < oil2Id ? [oil1Id, oil2Id] : [oil2Id, oil1Id];

		try {
			await db.essentialOilPairing.create({
				data: {
					oil1Id: first,
					oil2Id: second,
					notes: notes || null
				}
			});
		} catch (e) {
			if ((e as { code?: string }).code === 'P2002') {
				return fail(400, { error: 'This pairing already exists' });
			}
			throw e;
		}

		return { success: true };
	},

	removePairing: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await db.essentialOilPairing.delete({ where: { id } });

		return { success: true };
	}
};
