import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const preselected = url.searchParams.get('formulation');

	const formulations = await db.formulation.findMany({
		orderBy: { updatedAt: 'desc' },
		select: { id: true, name: true, purpose: true }
	});

	return { formulations, preselected };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const formulationId = formData.get('formulationId')?.toString();
		const notes = formData.get('notes')?.toString().trim();
		const rating = formData.get('rating')?.toString();

		if (!formulationId) {
			return fail(400, { error: 'Please select a formulation' });
		}

		if (!notes) {
			return fail(400, { error: 'Notes are required', formulationId });
		}

		const formulation = await db.formulation.findUnique({
			where: { id: formulationId },
			select: { id: true }
		});

		if (!formulation) {
			return fail(404, { error: 'Formulation not found' });
		}

		await db.testLog.create({
			data: {
				formulationId,
				notes,
				rating: rating ? parseInt(rating) : null
			}
		});

		redirect(303, `/formulations/${formulationId}`);
	}
};
