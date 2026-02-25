import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { ML_PER_DROP } from '$lib/drops';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	const { name, purpose, status, totalVolumeMl, notes, carrierOils, essentialOils } = body;

	if (!name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	if (!carrierOils?.length) {
		return json({ error: 'At least one carrier oil is required' }, { status: 400 });
	}

	const formulation = await db.formulation.create({
		data: {
			name: name.trim(),
			purpose: purpose || null,
			status: status || 'not-tested',
			totalVolumeMl: totalVolumeMl || null,
			notes: notes || null,
			carrierOils: {
				create: carrierOils.map((co: { id: string; percentage: number }) => ({
					carrierOilId: co.id,
					percentage: co.percentage
				}))
			},
			essentialOils: {
				create:
					essentialOils
						?.filter((eo: { drops: number }) => eo.drops > 0)
						.map((eo: { id: string; drops: number }) => ({
							essentialOilId: eo.id,
							drops: eo.drops,
							// Calculate percentage based on drops and batch size
							percentage: totalVolumeMl ? ((eo.drops * ML_PER_DROP) / totalVolumeMl) * 100 : null
						})) ?? []
			}
		}
	});

	return json({ id: formulation.id }, { status: 201 });
};

export const GET: RequestHandler = async ({ url }) => {
	const purpose = url.searchParams.get('purpose');

	const formulations = await db.formulation.findMany({
		where: purpose ? { purpose } : undefined,
		orderBy: { updatedAt: 'desc' },
		include: {
			essentialOils: {
				include: { essentialOil: true }
			},
			carrierOils: {
				include: { carrierOil: true }
			},
			_count: { select: { testLogs: true } }
		}
	});

	return json(formulations);
};
