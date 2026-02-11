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
			<h1 class="font-display text-2xl font-bold tracking-wide text-parchment-200">Journal</h1>
			<p class="mt-1 font-display text-sm text-parchment-600 italic">
				Your formulation notes and observations
			</p>
		</div>
		<button onclick={() => (showForm = true)} class="btn-vintage">
			<span class="flex items-center gap-2">
				<i class="fa-sharp fa-solid fa-plus"></i>
				New Entry
			</span>
		</button>
	</div>

	<!-- New Entry Form -->
	{#if showForm}
		<div class="v-card p-5">
			<h2 class="mb-3 font-display text-lg font-semibold text-parchment-200">New Journal Entry</h2>

			{#if form?.error}
				<div class="scoop-sm mb-4 bg-red-500/15 p-3 text-sm text-red-400">
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
					<label for="title" class="mb-1 block text-sm font-medium text-parchment-400">
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
					<label for="content" class="mb-1 block text-sm font-medium text-parchment-400">
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
					<button type="button" onclick={() => (showForm = false)} class="btn-outline flex-1">
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Entries -->
	{#if data.entries.length === 0}
		<div class="v-card p-8 text-center">
			<i class="fa-duotone fa-solid fa-book-open text-4xl text-ink-500"></i>
			<p class="mt-3 text-sm text-parchment-600">No journal entries yet</p>
			<button onclick={() => (showForm = true)} class="btn-vintage mt-4 text-sm">
				Write your first entry
			</button>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.entries as entry (entry.id)}
				<div class="v-card p-4">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								{#if entry.title}
									<h3 class="font-display text-lg font-semibold text-parchment-200">
										{entry.title}
									</h3>
								{/if}
								<span class="text-xs text-parchment-700">
									{formatDateRelative(entry.createdAt)}
								</span>
							</div>
							<p class="mt-2 text-sm whitespace-pre-wrap text-parchment-500">
								{entry.content}
							</p>
							<p class="mt-2 text-xs text-parchment-700">{formatDate(entry.createdAt)}</p>
						</div>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={entry.id} />
							<button
								type="submit"
								class="scoop-sm p-1.5 text-red-400/50 transition hover:bg-red-500/10 hover:text-red-400"
								aria-label="Delete entry"
							>
								<i class="fa-sharp fa-regular fa-trash-can"></i>
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
