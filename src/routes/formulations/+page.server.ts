import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
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

	return { formulations, filter: purpose };
};
