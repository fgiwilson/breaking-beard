import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const purpose = url.searchParams.get('purpose');
	const status = url.searchParams.get('status');
	const melissaApproved = url.searchParams.get('melissaApproved') === 'true';

	const where: Record<string, unknown> = {};
	if (purpose) where.purpose = purpose;
	if (status) where.status = status;
	if (melissaApproved) where.melissaApproved = true;

	const formulations = await db.formulation.findMany({
		where: Object.keys(where).length > 0 ? where : undefined,
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

	return {
		formulations,
		filter: purpose,
		statusFilter: status,
		melissaFilter: melissaApproved
	};
};
