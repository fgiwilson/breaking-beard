import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const items = await db.essentialOilWishlist.findMany({
		orderBy: [{ purchased: 'asc' }, { priority: 'desc' }, { name: 'asc' }]
	});

	return { items };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const scentCategory = formData.get('scentCategory')?.toString();
		const notes = formData.get('notes')?.toString().trim();
		const priority = formData.get('priority')?.toString();
		const purchaseUrl = formData.get('purchaseUrl')?.toString().trim();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		try {
			await db.essentialOilWishlist.create({
				data: {
					name,
					scentCategory: scentCategory || null,
					notes: notes || null,
					priority: priority ? parseInt(priority) : 0,
					purchaseUrl: purchaseUrl || null
				}
			});
		} catch (e) {
			if ((e as { code?: string }).code === 'P2002') {
				return fail(400, { error: 'An oil with this name is already on the wishlist' });
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
		const notes = formData.get('notes')?.toString().trim();
		const priority = formData.get('priority')?.toString();
		const purchaseUrl = formData.get('purchaseUrl')?.toString().trim();

		if (!id || !name) {
			return fail(400, { error: 'ID and name are required' });
		}

		try {
			await db.essentialOilWishlist.update({
				where: { id },
				data: {
					name,
					scentCategory: scentCategory || null,
					notes: notes || null,
					priority: priority ? parseInt(priority) : 0,
					purchaseUrl: purchaseUrl || null
				}
			});
		} catch (e) {
			if ((e as { code?: string }).code === 'P2002') {
				return fail(400, { error: 'An oil with this name is already on the wishlist' });
			}
			throw e;
		}

		return { success: true };
	},

	togglePurchased: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		const item = await db.essentialOilWishlist.findUnique({
			where: { id },
			select: { purchased: true }
		});

		if (!item) {
			return fail(404, { error: 'Item not found' });
		}

		await db.essentialOilWishlist.update({
			where: { id },
			data: { purchased: !item.purchased }
		});

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await db.essentialOilWishlist.delete({ where: { id } });

		return { success: true };
	}
};
