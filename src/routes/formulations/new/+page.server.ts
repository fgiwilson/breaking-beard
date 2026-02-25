import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const [carrierOils, essentialOils] = await Promise.all([
		db.carrierOil.findMany({ orderBy: { name: 'asc' } }),
		db.essentialOil.findMany({ orderBy: { name: 'asc' } })
	]);

	return { carrierOils, essentialOils };
};
