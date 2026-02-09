import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import { createTestDb, seedDiaryEntry, mockFormDataRequest } from '$lib/server/test-helpers';

let testDb: PrismaClient;

vi.mock('$lib/server/db', () => ({
	get db() {
		return testDb;
	}
}));

beforeEach(async () => {
	testDb = await createTestDb();
});

afterEach(async () => {
	await testDb.$disconnect();
});

describe('Diary load', () => {
	it('returns empty list', async () => {
		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.entries).toEqual([]);
	});

	it('returns entries ordered by createdAt desc', async () => {
		// Create entries with slight delay to ensure different timestamps
		await seedDiaryEntry(testDb, { content: 'First' });
		await seedDiaryEntry(testDb, { content: 'Second' });

		const { load } = await import('./+page.server');
		const result = (await load({} as any))!;

		expect(result.entries).toHaveLength(2);
		// Most recent first
		expect(result.entries[0].content).toBe('Second');
	});
});

describe('Diary create action', () => {
	it('creates an entry with content and title', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({ content: 'Today I tested bergamot.', title: 'Day 1' })
		} as any);

		expect(result).toEqual({ success: true });

		const entries = await testDb.diaryEntry.findMany();
		expect(entries).toHaveLength(1);
		expect(entries[0].content).toBe('Today I tested bergamot.');
		expect(entries[0].title).toBe('Day 1');
	});

	it('creates an entry without title', async () => {
		const { actions } = await import('./+page.server');
		await actions.create({
			request: mockFormDataRequest({ content: 'No title entry' })
		} as any);

		const entries = await testDb.diaryEntry.findMany();
		expect(entries[0].title).toBeNull();
	});

	it('trims content', async () => {
		const { actions } = await import('./+page.server');
		await actions.create({
			request: mockFormDataRequest({ content: '  Trimmed content  ' })
		} as any);

		const entries = await testDb.diaryEntry.findMany();
		expect(entries[0].content).toBe('Trimmed content');
	});

	it('fails when content is missing', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
		expect((result as any).data.error).toBe('Content is required');
	});

	it('fails when content is only whitespace', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.create({
			request: mockFormDataRequest({ content: '   ' })
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});

describe('Diary delete action', () => {
	it('deletes an entry', async () => {
		const entry = await seedDiaryEntry(testDb, { content: 'To delete' });

		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({ id: entry.id })
		} as any);

		expect(result).toEqual({ success: true });
		expect(await testDb.diaryEntry.findUnique({ where: { id: entry.id } })).toBeNull();
	});

	it('fails without id', async () => {
		const { actions } = await import('./+page.server');
		const result = await actions.delete({
			request: mockFormDataRequest({})
		} as any);

		expect(result).toHaveProperty('status', 400);
	});
});
