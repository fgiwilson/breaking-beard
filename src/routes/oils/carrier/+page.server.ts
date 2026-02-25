import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const oils = await db.carrierOil.findMany({
		orderBy: { name: 'asc' },
		include: {
			_count: { select: { formulations: true } }
		}
	});

	return { oils };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const comedogenic = formData.get('comedogenic')?.toString();
		const absorption = formData.get('absorption')?.toString();
		const vitamins = formData.get('vitamins')?.toString().trim();
		const texture = formData.get('texture')?.toString();
		const notes = formData.get('notes')?.toString().trim();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		try {
			await db.carrierOil.create({
				data: {
					name,
					comedogenic: comedogenic ? parseInt(comedogenic) : null,
					absorption: absorption || null,
					vitamins: vitamins || null,
					texture: texture || null,
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
		const comedogenic = formData.get('comedogenic')?.toString();
		const absorption = formData.get('absorption')?.toString();
		const vitamins = formData.get('vitamins')?.toString().trim();
		const texture = formData.get('texture')?.toString();
		const notes = formData.get('notes')?.toString().trim();

		if (!id || !name) {
			return fail(400, { error: 'ID and name are required' });
		}

		try {
			await db.carrierOil.update({
				where: { id },
				data: {
					name,
					comedogenic: comedogenic ? parseInt(comedogenic) : null,
					absorption: absorption || null,
					vitamins: vitamins || null,
					texture: texture || null,
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

		await db.carrierOil.delete({ where: { id } });

		return { success: true };
	}
};
