import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrismaClient } from '$lib/server/generated/prisma/client';
import { createTestDb, seedDiaryEntry, mockJsonRequest, mockUrl } from '$lib/server/test-helpers';

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

describe('POST /api/diary', () => {
	it('creates a diary entry with content and title', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({ content: 'Today I tested bergamot.', title: 'Day 1' })
		} as any);

		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.content).toBe('Today I tested bergamot.');
		expect(body.title).toBe('Day 1');
		expect(body.id).toBeDefined();
	});

	it('creates an entry without title', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({ content: 'No title' })
		} as any);

		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.title).toBeNull();
	});

	it('trims content and title', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({ content: '  Trimmed  ', title: '  Title  ' })
		} as any);

		const body = await response.json();
		expect(body.content).toBe('Trimmed');
		expect(body.title).toBe('Title');
	});

	it('returns 400 when content is missing', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({})
		} as any);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe('Content is required');
	});

	it('returns 400 when content is whitespace', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({ content: '   ' })
		} as any);

		expect(response.status).toBe(400);
	});

	it('sets title to null when only whitespace', async () => {
		const { POST } = await import('./+server');
		const response = await POST({
			request: mockJsonRequest({ content: 'Content', title: '   ' })
		} as any);

		const body = await response.json();
		expect(body.title).toBeNull();
	});
});

describe('GET /api/diary', () => {
	it('returns entries ordered by createdAt desc', async () => {
		await seedDiaryEntry(testDb, { content: 'First' });
		await seedDiaryEntry(testDb, { content: 'Second' });

		const { GET } = await import('./+server');
		const response = await GET({ url: mockUrl() } as any);
		const body = await response.json();

		expect(body).toHaveLength(2);
		expect(body[0].content).toBe('Second');
	});

	it('supports take parameter', async () => {
		for (let i = 0; i < 5; i++) {
			await seedDiaryEntry(testDb, { content: `Entry ${i}` });
		}

		const { GET } = await import('./+server');
		const response = await GET({ url: mockUrl({ take: '2' }) } as any);
		const body = await response.json();

		expect(body).toHaveLength(2);
	});

	it('supports skip parameter', async () => {
		for (let i = 0; i < 5; i++) {
			await seedDiaryEntry(testDb, { content: `Entry ${i}` });
		}

		const { GET } = await import('./+server');
		const response = await GET({ url: mockUrl({ skip: '3' }) } as any);
		const body = await response.json();

		expect(body).toHaveLength(2);
	});

	it('returns empty array when no entries', async () => {
		const { GET } = await import('./+server');
		const response = await GET({ url: mockUrl() } as any);
		const body = await response.json();

		expect(body).toEqual([]);
	});
});
