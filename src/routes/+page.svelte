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
		return map[category?.toLowerCase() ?? ''] ?? 'bg-ink-500 text-parchment-400';
	}
</script>

<div class="space-y-6">
	<!-- Page Title -->
	<div class="text-center" style="animation: fadeInDown 0.6s ease-out;">
		<div class="ornament-line"></div>
		<h1 class="font-display text-2xl font-medium tracking-wide text-parchment-200 lg:text-3xl">
			The Laboratory
		</h1>
		<p class="mt-1 font-display text-sm text-parchment-600 italic">An Overview of Your Craft</p>
		<div class="ornament-line"></div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-3 gap-3">
		<a href={resolve('/oils/carrier')} class="v-card p-4 transition hover:shadow-lg">
			<div class="text-[0.6rem] font-semibold tracking-[0.15em] text-parchment-600 uppercase">
				Carrier Oils
			</div>
			<div class="mt-1 font-display text-3xl font-bold text-amber-400">
				{data.stats.carrierOils}
			</div>
			<div class="mt-0.5 text-xs text-parchment-700 italic">in the cupboard</div>
		</a>
		<a href={resolve('/oils/essential')} class="v-card p-4 transition hover:shadow-lg">
			<div class="text-[0.6rem] font-semibold tracking-[0.15em] text-parchment-600 uppercase">
				Essential Oils
			</div>
			<div class="mt-1 font-display text-3xl font-bold text-amber-400">
				{data.stats.essentialOils}
			</div>
			<div class="mt-0.5 text-xs text-parchment-700 italic">distillations on hand</div>
		</a>
		<a href={resolve('/formulations')} class="v-card p-4 transition hover:shadow-lg">
			<div class="text-[0.6rem] font-semibold tracking-[0.15em] text-parchment-600 uppercase">
				Formulations
			</div>
			<div class="mt-1 font-display text-3xl font-bold text-amber-400">
				{data.stats.formulations}
			</div>
			<div class="mt-0.5 text-xs text-parchment-700 italic">recipes in the ledger</div>
		</a>
	</div>

	<!-- Quick Note -->
	<div class="v-card p-5">
		<h2 class="mb-3 font-display text-lg font-semibold text-parchment-200">Quick Note</h2>
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
					<i class="fa-duotone fa-solid fa-spinner fa-spin"></i>
				{:else}
					Add
				{/if}
			</button>
		</form>
	</div>

	<!-- Two column layout -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Recent Formulas -->
		<div class="v-card p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-parchment-200">Recent Formulae</h2>
				<a
					href={resolve('/formulations')}
					class="font-display text-sm text-amber-600 transition hover:text-amber-400"
					>View all &rarr;</a
				>
			</div>
			{#if data.formulations.length === 0}
				<div class="py-8 text-center">
					<i class="fa-duotone fa-solid fa-flask-vial text-4xl text-ink-500"></i>
					<p class="mt-2 text-sm text-parchment-600">No formulae yet</p>
					<a href={resolve('/formulations/new')} class="btn-vintage mt-3 inline-block text-sm">
						Create your first
					</a>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.formulations as formula (formula.id)}
						<a
							href={resolve(`/formulations/${formula.id}`)}
							class="block rounded-lg border border-amber-500/10 bg-ink-600/50 p-3 transition hover:border-amber-500/25 hover:bg-ink-600"
						>
							<div class="flex items-start justify-between">
								<div>
									<h3 class="font-display font-semibold text-parchment-300">{formula.name}</h3>
									<p class="mt-0.5 text-xs text-parchment-600">
										{#if formula.purpose}
											<span class="capitalize">{formula.purpose}</span> &middot;
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
		<div class="v-card p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-parchment-200">Test Log</h2>
			</div>
			{#if data.recentTestLogs.length === 0}
				<div class="py-8 text-center">
					<i class="fa-duotone fa-solid fa-clipboard-list text-4xl text-ink-500"></i>
					<p class="mt-2 text-sm text-parchment-600">No test logs yet</p>
					<p class="mt-1 text-xs text-parchment-700">Create a formula and start testing!</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.recentTestLogs as log (log.id)}
						<div class="diary-entry">
							<div class="flex items-start justify-between">
								<div>
									<p class="text-sm font-medium text-parchment-300">{log.formulation.name}</p>
									<p class="mt-0.5 text-xs text-parchment-600">{formatDate(log.date)}</p>
								</div>
								{#if log.rating}
									<div class="rating">
										{#each [1, 2, 3, 4, 5] as star (star)}
											<i
												class="star {star <= log.rating
													? 'fa-sharp-duotone fa-solid fa-star filled'
													: 'fa-sharp-duotone fa-regular fa-star'}"
											></i>
										{/each}
									</div>
								{/if}
							</div>
							<p class="mt-1 text-sm text-parchment-500">{log.notes}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Journal Entries -->
	{#if data.diaryEntries.length > 0}
		<div class="v-card p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-parchment-200">Journal</h2>
				<a
					href={resolve('/diary')}
					class="font-display text-sm text-amber-600 transition hover:text-amber-400"
					>View all &rarr;</a
				>
			</div>
			<div class="space-y-3">
				{#each data.diaryEntries as entry (entry.id)}
					<div class="diary-entry">
						<div class="flex items-start justify-between">
							{#if entry.title}
								<p class="text-sm font-medium text-parchment-300">{entry.title}</p>
							{/if}
							<p class="text-xs text-parchment-600">{formatDate(entry.createdAt)}</p>
						</div>
						<p class="mt-1 text-sm text-parchment-500">{entry.content}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Mobile FAB -->
<a href={resolve('/formulations/new')} class="fab sm:hidden" aria-label="New Formula">
	<i class="fa-sharp fa-solid fa-plus text-xl"></i>
</a>
