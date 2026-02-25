import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const [formulations, recentTestLogs, carrierOils, essentialOils, diaryEntries] =
		await Promise.all([
			db.formulation.findMany({
				orderBy: { updatedAt: 'desc' },
				take: 5,
				include: {
					essentialOils: {
						include: { essentialOil: true }
					},
					carrierOils: {
						include: { carrierOil: true }
					},
					_count: { select: { testLogs: true } }
				}
			}),
			db.testLog.findMany({
				orderBy: { date: 'desc' },
				take: 5,
				include: {
					formulation: true
				}
			}),
			db.carrierOil.count(),
			db.essentialOil.count(),
			db.diaryEntry.findMany({
				orderBy: { createdAt: 'desc' },
				take: 3
			})
		]);

	return {
		formulations,
		recentTestLogs,
		stats: {
			carrierOils,
			essentialOils,
			formulations: formulations.length
		},
		diaryEntries
	};
};
