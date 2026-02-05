import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
	const { content, title } = await request.json();

	if (!content?.trim()) {
		return json({ error: 'Content is required' }, { status: 400 });
	}

	const entry = await db.diaryEntry.create({
		data: {
			content: content.trim(),
			title: title?.trim() || null
		}
	});

	return json(entry, { status: 201 });
};

export const GET: RequestHandler = async ({ url }) => {
	const take = parseInt(url.searchParams.get('take') || '20');
	const skip = parseInt(url.searchParams.get('skip') || '0');

	const entries = await db.diaryEntry.findMany({
		orderBy: { createdAt: 'desc' },
		take,
		skip
	});

	return json(entries);
};
