<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	// Quick note state
	let quickNote = $state('');
	let isSubmitting = $state(false);

	async function submitQuickNote() {
		if (!quickNote.trim()) return;
		isSubmitting = true;
		try {
			await fetch('/api/diary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: quickNote })
			});
			quickNote = '';
			// Refresh the page to show new entry
			window.location.reload();
		} finally {
			isSubmitting = false;
		}
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getScentBadgeClass(category: string | null): string {
		const map: Record<string, string> = {
			citrus: 'badge-citrus',
			woody: 'badge-woody',
			herbal: 'badge-herbal',
			floral: 'badge-floral',
			spicy: 'badge-spicy',
			earthy: 'badge-earthy'
		};
		return map[category?.toLowerCase() ?? ''] ?? 'bg-amber-200 text-leather-800';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-end justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold text-leather-900 lg:text-3xl">
				The Formulation Lab
			</h1>
			<p class="mt-1 text-sm text-amber-700">Craft your perfect beard oil blend</p>
		</div>
		<a href={resolve('/formulations/new')} class="btn-vintage hidden sm:inline-flex">
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				New Formula
			</span>
		</a>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-3 gap-3">
		<a href={resolve('/oils/carrier')} class="card-glass rounded-xl p-4 transition hover:shadow-md">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
					<svg class="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 3c-4 4-7 7.5-7 11a7 7 0 1014 0c0-3.5-3-7-7-11z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-leather-900">{data.stats.carrierOils}</p>
					<p class="text-xs text-amber-700">Carriers</p>
				</div>
			</div>
		</a>
		<a
			href={resolve('/oils/essential')}
			class="card-glass rounded-xl p-4 transition hover:shadow-md"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
					<svg class="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 3v2m6-2v2M9 5h6m-7 4l-2 10h12l-2-10M8 9h8"
						/>
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-leather-900">{data.stats.essentialOils}</p>
					<p class="text-xs text-amber-700">Essentials</p>
				</div>
			</div>
		</a>
		<a href={resolve('/formulations')} class="card-glass rounded-xl p-4 transition hover:shadow-md">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
					<svg class="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-leather-900">{data.stats.formulations}</p>
					<p class="text-xs text-amber-700">Formulas</p>
				</div>
			</div>
		</a>
	</div>

	<!-- Quick Note -->
	<div class="card-glass rounded-xl p-4">
		<h2 class="mb-3 font-display text-lg font-semibold text-leather-900">Quick Note</h2>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				submitQuickNote();
			}}
			class="flex gap-2"
		>
			<input
				type="text"
				bind:value={quickNote}
				placeholder="Jot down a thought about your latest blend..."
				class="flex-1 text-sm"
			/>
			<button
				type="submit"
				disabled={isSubmitting || !quickNote.trim()}
				class="btn-vintage disabled:opacity-50"
			>
				{#if isSubmitting}
					<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
							fill="none"
							opacity="0.25"
						/>
						<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
				{:else}
					Add
				{/if}
			</button>
		</form>
	</div>

	<!-- Two column layout -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent Formulas -->
		<div class="card-glass rounded-xl p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-leather-900">Recent Formulas</h2>
				<a href={resolve('/formulations')} class="text-sm text-amber-600 hover:text-amber-700"
					>View all</a
				>
			</div>
			{#if data.formulations.length === 0}
				<div class="py-8 text-center">
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
							d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
						/>
					</svg>
					<p class="mt-2 text-sm text-amber-700">No formulas yet</p>
					<a href={resolve('/formulations/new')} class="btn-vintage mt-3 inline-block text-sm">
						Create your first
					</a>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.formulations as formula (formula.id)}
						<a
							href={resolve(`/formulations/${formula.id}`)}
							class="block rounded-lg border border-amber-100 bg-white/50 p-3 transition hover:border-amber-300 hover:shadow-sm"
						>
							<div class="flex items-start justify-between">
								<div>
									<h3 class="font-medium text-leather-900">{formula.name}</h3>
									<p class="mt-0.5 text-xs text-amber-600">
										{#if formula.purpose}
											<span class="capitalize">{formula.purpose}</span> •
										{/if}
										{formula._count.testLogs} tests
									</p>
								</div>
								<div class="flex flex-wrap gap-1">
									{#each formula.essentialOils.slice(0, 3) as eo (eo.id)}
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
												eo.essentialOil.scentCategory
											)}"
										>
											{eo.essentialOil.name}
										</span>
									{/each}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent Test Logs -->
		<div class="card-glass rounded-xl p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-leather-900">Test Log</h2>
			</div>
			{#if data.recentTestLogs.length === 0}
				<div class="py-8 text-center">
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
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<p class="mt-2 text-sm text-amber-700">No test logs yet</p>
					<p class="mt-1 text-xs text-amber-600">Create a formula and start testing!</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.recentTestLogs as log (log.id)}
						<div class="diary-entry">
							<div class="flex items-start justify-between">
								<div>
									<p class="text-sm font-medium text-leather-900">{log.formulation.name}</p>
									<p class="mt-0.5 text-xs text-amber-600">{formatDate(log.date)}</p>
								</div>
								{#if log.rating}
									<div class="rating">
										{#each [1, 2, 3, 4, 5] as star (star)}
											<svg
												class="star"
												class:filled={star <= log.rating}
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
												/>
											</svg>
										{/each}
									</div>
								{/if}
							</div>
							<p class="mt-1 text-sm text-leather-700">{log.notes}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Journal Entries -->
	{#if data.diaryEntries.length > 0}
		<div class="card-glass rounded-xl p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-leather-900">Journal</h2>
				<a href={resolve('/diary')} class="text-sm text-amber-600 hover:text-amber-700">View all</a>
			</div>
			<div class="space-y-3">
				{#each data.diaryEntries as entry (entry.id)}
					<div class="diary-entry">
						<div class="flex items-start justify-between">
							{#if entry.title}
								<p class="text-sm font-medium text-leather-900">{entry.title}</p>
							{/if}
							<p class="text-xs text-amber-600">{formatDate(entry.createdAt)}</p>
						</div>
						<p class="mt-1 text-sm text-leather-700">{entry.content}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Mobile FAB -->
<a href={resolve('/formulations/new')} class="fab sm:hidden" aria-label="New Formula">
	<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
	</svg>
</a>
