import { PrismaClient } from '../src/lib/server/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('Seeding database...');

	// Current carrier oil inventory from CLAUDE.md
	const carrierOils = [
		{
			name: 'Jojoba',
			comedogenic: 2,
			absorption: 'medium',
			vitamins: 'E, B',
			texture: 'light',
			notes:
				'Most similar to natural sebum. Great for all skin types. Non-greasy feel. Excellent base oil for beard formulations.'
		},
		{
			name: 'Sweet Almond',
			comedogenic: 2,
			absorption: 'medium',
			vitamins: 'A, E, K',
			texture: 'medium',
			notes:
				'Affordable and versatile. Slightly nutty scent. Good for testing new formulations. Moisturizing without being heavy.'
		}
	];

	// Current essential oil inventory from CLAUDE.md
	const essentialOils = [
		{
			name: 'Eucalyptus',
			scentCategory: 'herbal',
			safetyNotes: 'Avoid if asthmatic. Keep away from face in high concentrations.',
			minUsagePct: 0.5,
			maxUsagePct: 2,
			notes: 'Clean, medicinal scent. Great for morning blends. Adds freshness and opens airways.'
		},
		{
			name: 'Bergamot',
			scentCategory: 'citrus',
			safetyNotes: 'Phototoxic - avoid sun exposure for 12-18 hours after application.',
			minUsagePct: 0.5,
			maxUsagePct: 2,
			notes:
				'Favorite citrus! Sophisticated, not sharp. Bergamot-forward blends are the goal. Pairs beautifully with woody and herbal notes.'
		},
		{
			name: 'Lemongrass',
			scentCategory: 'citrus',
			safetyNotes: 'Can cause skin sensitization. Use at low concentrations.',
			minUsagePct: 0.25,
			maxUsagePct: 1,
			notes:
				'Bright and grassy. Can be overpowering - use sparingly. Good supporting note but not as a primary scent.'
		},
		{
			name: 'Cypress',
			scentCategory: 'woody',
			safetyNotes: null,
			minUsagePct: 0.5,
			maxUsagePct: 2,
			notes:
				'Fresh, clean woody scent. Not as heavy as cedar. Great for morning blends. Pairs perfectly with bergamot.'
		},
		{
			name: 'Lavender',
			scentCategory: 'floral',
			safetyNotes: null,
			minUsagePct: 0.5,
			maxUsagePct: 2,
			notes:
				'Versatile and calming. Works in both morning and evening blends. Classic choice for a reason. Balances other scents well.'
		},
		{
			name: 'Spearmint',
			scentCategory: 'herbal',
			safetyNotes: 'Avoid during pregnancy in high doses.',
			minUsagePct: 0.5,
			maxUsagePct: 2,
			notes:
				'Softer than peppermint. Fresh and uplifting. Great for morning "clean air fresh" blends with lavender and eucalyptus.'
		},
		{
			name: 'Frankincense',
			scentCategory: 'resinous',
			safetyNotes: null,
			minUsagePct: 0.5,
			maxUsagePct: 2,
			notes:
				'Warm, resinous, slightly sweet. Grounding scent perfect for evening blends. Ancient and sophisticated.'
		},
		{
			name: 'Cedarwood',
			scentCategory: 'woody',
			safetyNotes: null,
			minUsagePct: 0.5,
			maxUsagePct: 2,
			notes:
				'Classic masculine woody scent. Currently exploring alternatives - can be too heavy/dominant. Good grounding note but needs balance.'
		},
		{
			name: 'Black Pepper',
			scentCategory: 'spicy',
			safetyNotes: 'Can cause skin irritation at high concentrations.',
			minUsagePct: 0.25,
			maxUsagePct: 1,
			notes:
				'Warm and spicy. Use very sparingly - a little goes a long way. Adds interesting depth to citrus-woody blends.'
		}
	];

	// Upsert carrier oils
	for (const oil of carrierOils) {
		await prisma.carrierOil.upsert({
			where: { name: oil.name },
			update: oil,
			create: oil
		});
		console.log(`  Carrier oil: ${oil.name}`);
	}

	// Upsert essential oils
	for (const oil of essentialOils) {
		await prisma.essentialOil.upsert({
			where: { name: oil.name },
			update: oil,
			create: oil
		});
		console.log(`  Essential oil: ${oil.name}`);
	}

	// Add some natural pairings
	const pairings = [
		{ oil1: 'Bergamot', oil2: 'Cypress', notes: 'Core of refined citrus-woody morning blend' },
		{ oil1: 'Bergamot', oil2: 'Black Pepper', notes: 'Adds warmth and depth to citrus' },
		{ oil1: 'Lavender', oil2: 'Bergamot', notes: 'Classic pairing - floral meets citrus' },
		{ oil1: 'Lavender', oil2: 'Eucalyptus', notes: 'Clean and fresh - great for morning' },
		{
			oil1: 'Lavender',
			oil2: 'Frankincense',
			notes: 'Calming evening combination - floral and resinous'
		},
		{ oil1: 'Cedarwood', oil2: 'Lavender', notes: 'Classic evening blend foundation' },
		{ oil1: 'Cedarwood', oil2: 'Frankincense', notes: 'Grounding woody-resinous combination' },
		{ oil1: 'Eucalyptus', oil2: 'Spearmint', notes: 'Fresh and invigorating - cooling effect' }
	];

	for (const pairing of pairings) {
		const oil1 = await prisma.essentialOil.findUnique({ where: { name: pairing.oil1 } });
		const oil2 = await prisma.essentialOil.findUnique({ where: { name: pairing.oil2 } });

		if (oil1 && oil2) {
			// Always store with smaller ID first for consistency
			const [first, second] = oil1.id < oil2.id ? [oil1.id, oil2.id] : [oil2.id, oil1.id];

			await prisma.essentialOilPairing.upsert({
				where: { oil1Id_oil2Id: { oil1Id: first, oil2Id: second } },
				update: { notes: pairing.notes },
				create: {
					oil1Id: first,
					oil2Id: second,
					notes: pairing.notes
				}
			});
			console.log(`  Pairing: ${pairing.oil1} + ${pairing.oil2}`);
		}
	}

	console.log('Seeding complete!');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
