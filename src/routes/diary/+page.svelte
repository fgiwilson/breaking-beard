<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps, ActionData } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let showForm = $state(false);

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatDateRelative(date: Date | string): string {
		const d = new Date(date);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return formatDate(date);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-end justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold text-leather-900">Journal</h1>
			<p class="mt-1 text-sm text-amber-700">Your formulation notes and observations</p>
		</div>
		<button onclick={() => (showForm = true)} class="btn-vintage">
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				New Entry
			</span>
		</button>
	</div>

	<!-- New Entry Form -->
	{#if showForm}
		<div class="card-glass rounded-xl p-4">
			<h2 class="mb-3 font-display text-lg font-semibold text-leather-900">New Journal Entry</h2>

			{#if form?.error}
				<div class="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							showForm = false;
						}
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="title" class="mb-1 block text-sm font-medium text-leather-800">
						Title (optional)
					</label>
					<input
						type="text"
						id="title"
						name="title"
						class="w-full"
						placeholder="e.g., Morning blend observations"
					/>
				</div>

				<div>
					<label for="content" class="mb-1 block text-sm font-medium text-leather-800">
						Entry
					</label>
					<textarea
						id="content"
						name="content"
						rows="4"
						required
						class="w-full"
						placeholder="What did you observe or learn today?"
					></textarea>
				</div>

				<div class="flex gap-3">
					<button type="submit" class="btn-vintage flex-1">Save Entry</button>
					<button
						type="button"
						onclick={() => (showForm = false)}
						class="flex-1 rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-leather-700 transition hover:bg-amber-50"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Entries -->
	{#if data.entries.length === 0}
		<div class="card-glass rounded-xl p-8 text-center">
			<svg
				class="mx-auto h-12 w-12 text-amber-300"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
				/>
			</svg>
			<p class="mt-3 text-sm text-amber-700">No journal entries yet</p>
			<button onclick={() => (showForm = true)} class="btn-vintage mt-4 text-sm">
				Write your first entry
			</button>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.entries as entry (entry.id)}
				<div class="card-glass rounded-xl p-4">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								{#if entry.title}
									<h3 class="font-display text-lg font-semibold text-leather-900">
										{entry.title}
									</h3>
								{/if}
								<span class="text-xs text-amber-600">{formatDateRelative(entry.createdAt)}</span>
							</div>
							<p class="mt-2 text-sm whitespace-pre-wrap text-leather-700">{entry.content}</p>
							<p class="mt-2 text-xs text-amber-500">{formatDate(entry.createdAt)}</p>
						</div>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={entry.id} />
							<button
								type="submit"
								class="rounded p-1.5 text-amber-400 transition hover:bg-red-50 hover:text-red-500"
								aria-label="Delete entry"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
