import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const entries = await db.diaryEntry.findMany({
		orderBy: { createdAt: 'desc' }
	});

	return { entries };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const content = formData.get('content')?.toString().trim();
		const title = formData.get('title')?.toString().trim();

		if (!content) {
			return fail(400, { error: 'Content is required' });
		}

		await db.diaryEntry.create({
			data: {
				content,
				title: title || null
			}
		});

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await db.diaryEntry.delete({ where: { id } });

		return { success: true };
	}
};
