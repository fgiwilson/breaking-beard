<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	let name = $state('');
	let purpose = $state<string>('');
	let totalVolumeMl = $state(30);
	let notes = $state('');
	let isSubmitting = $state(false);

	// Carrier oils state
	let selectedCarriers = $state<Array<{ id: string; percentage: number }>>([]);

	// Essential oils state
	let selectedEssentials = $state<Array<{ id: string; drops: number }>>([]);

	// Calculate total carrier percentage
	let totalCarrierPct = $derived(selectedCarriers.reduce((sum, c) => sum + c.percentage, 0));

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || selectedCarriers.length === 0) return;

		isSubmitting = true;
		try {
			const response = await fetch('/api/formulations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					purpose: purpose || null,
					totalVolumeMl,
					notes: notes.trim() || null,
					carrierOils: selectedCarriers,
					essentialOils: selectedEssentials.filter((e) => e.drops > 0)
				})
			});

			if (response.ok) {
				const { id } = await response.json();
				window.location.href = `/formulations/${id}`;
			}
		} finally {
			isSubmitting = false;
		}
	}

	function addCarrier(id: string) {
		if (!selectedCarriers.find((c) => c.id === id)) {
			selectedCarriers = [...selectedCarriers, { id, percentage: 0 }];
		}
	}

	function removeCarrier(id: string) {
		selectedCarriers = selectedCarriers.filter((c) => c.id !== id);
	}

	function addEssential(id: string) {
		if (!selectedEssentials.find((e) => e.id === id)) {
			selectedEssentials = [...selectedEssentials, { id, drops: 1 }];
		}
	}

	function removeEssential(id: string) {
		selectedEssentials = selectedEssentials.filter((e) => e.id !== id);
	}

	function getCarrierName(id: string): string {
		return data.carrierOils.find((o) => o.id === id)?.name ?? '';
	}

	function getEssentialName(id: string): string {
		return data.essentialOils.find((o) => o.id === id)?.name ?? '';
	}

	function getScentCategory(id: string): string | null {
		return data.essentialOils.find((o) => o.id === id)?.scentCategory ?? null;
	}

	function getScentBadgeClass(category: string | null): string {
		const map: Record<string, string> = {
			citrus: 'badge-citrus',
			woody: 'badge-woody',
			herbal: 'badge-herbal',
			floral: 'badge-floral',
			spicy: 'badge-spicy',
			earthy: 'badge-earthy',
			resinous: 'badge-resinous'
		};
		return map[category?.toLowerCase() ?? ''] ?? 'bg-ink-500 text-parchment-400';
	}
</script>

<div class="space-y-6">
	<div>
		<a
			href={resolve('/formulations')}
			class="font-display text-sm text-amber-600 transition hover:text-amber-400"
			>&larr; Back</a
		>
		<h1 class="mt-2 font-display text-2xl font-bold tracking-wide text-parchment-200">
			New Formula
		</h1>
		<p class="mt-1 font-display text-sm italic text-parchment-600">
			Create a new beard oil blend
		</p>
	</div>

	<form onsubmit={handleSubmit} class="space-y-6">
		<!-- Basic Info -->
		<div class="v-card p-5">
			<h2 class="mb-4 font-display text-lg font-semibold text-parchment-200">Basic Info</h2>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<label for="name" class="mb-1 block text-sm font-medium text-parchment-400">
						Formula Name
					</label>
					<input
						type="text"
						id="name"
						bind:value={name}
						required
						class="w-full"
						placeholder="e.g., Morning Citrus Refresh"
					/>
				</div>

				<div>
					<label for="purpose" class="mb-1 block text-sm font-medium text-parchment-400">
						Purpose
					</label>
					<select id="purpose" bind:value={purpose} class="w-full">
						<option value="">Select...</option>
						<option value="morning">Morning</option>
						<option value="evening">Evening</option>
						<option value="all-day">All-Day</option>
					</select>
				</div>

				<div>
					<label for="volume" class="mb-1 block text-sm font-medium text-parchment-400">
						Batch Size (ml)
					</label>
					<input
						type="number"
						id="volume"
						bind:value={totalVolumeMl}
						min="5"
						max="100"
						class="w-full"
					/>
				</div>

				<div class="sm:col-span-2">
					<label for="notes" class="mb-1 block text-sm font-medium text-parchment-400"
						>Notes</label
					>
					<textarea
						id="notes"
						bind:value={notes}
						rows="2"
						class="w-full"
						placeholder="What inspired this blend?"
					></textarea>
				</div>
			</div>
		</div>

		<!-- Carrier Oils -->
		<div class="v-card p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-parchment-200">Carrier Oils</h2>
				<span
					class="text-sm font-medium"
					class:text-sage-300={totalCarrierPct === 100}
					class:text-parchment-600={totalCarrierPct !== 100}
				>
					{totalCarrierPct}%
				</span>
			</div>

			{#if selectedCarriers.length > 0}
				<div class="mb-4 space-y-2">
					{#each selectedCarriers as carrier, i (carrier.id)}
						<div class="flex items-center gap-3 rounded-lg bg-ink-600 p-2">
							<span class="flex-1 text-sm font-medium text-parchment-300">
								{getCarrierName(carrier.id)}
							</span>
							<input
								type="number"
								bind:value={selectedCarriers[i].percentage}
								min="0"
								max="100"
								class="w-20 text-center text-sm"
							/>
							<span class="text-sm text-parchment-600">%</span>
							<button
								type="button"
								onclick={() => removeCarrier(carrier.id)}
								class="text-red-400 hover:text-red-300"
								aria-label="Remove {getCarrierName(carrier.id)}"
							>
								<i class="fa-sharp fa-solid fa-xmark"></i>
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<div class="flex flex-wrap gap-2">
				{#each data.carrierOils.filter((o) => !selectedCarriers.find((c) => c.id === o.id)) as oil (oil.id)}
					<button
						type="button"
						onclick={() => addCarrier(oil.id)}
						class="scoop-sm bg-ink-600 px-3 py-1 text-sm text-parchment-500 transition hover:bg-ink-500 hover:text-amber-400"
					>
						+ {oil.name}
					</button>
				{/each}
			</div>

			{#if totalCarrierPct !== 100 && selectedCarriers.length > 0}
				<p class="mt-2 text-xs text-parchment-600">
					Tip: Carrier percentages should total 100%
				</p>
			{/if}
		</div>

		<!-- Essential Oils -->
		<div class="v-card p-5">
			<h2 class="mb-4 font-display text-lg font-semibold text-parchment-200">Essential Oils</h2>

			{#if selectedEssentials.length > 0}
				<div class="mb-4 space-y-2">
					{#each selectedEssentials as essential, i (essential.id)}
						<div class="flex items-center gap-3 rounded-lg bg-ink-600 p-2">
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
									getScentCategory(essential.id)
								)}"
							>
								{getScentCategory(essential.id) || 'other'}
							</span>
							<span class="flex-1 text-sm font-medium text-parchment-300">
								{getEssentialName(essential.id)}
							</span>
							<input
								type="number"
								bind:value={selectedEssentials[i].drops}
								min="0"
								max="20"
								class="w-16 text-center text-sm"
							/>
							<span class="text-sm text-parchment-600">drops</span>
							<button
								type="button"
								onclick={() => removeEssential(essential.id)}
								class="text-red-400 hover:text-red-300"
								aria-label="Remove {getEssentialName(essential.id)}"
							>
								<i class="fa-sharp fa-solid fa-xmark"></i>
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<div class="flex flex-wrap gap-2">
				{#each data.essentialOils.filter((o) => !selectedEssentials.find((e) => e.id === o.id)) as oil (oil.id)}
					<button
						type="button"
						onclick={() => addEssential(oil.id)}
						class="rounded-full px-3 py-1 text-sm transition {getScentBadgeClass(
							oil.scentCategory
						)} hover:opacity-80"
					>
						+ {oil.name}
					</button>
				{/each}
			</div>

			<p class="mt-3 text-xs text-parchment-600">
				Tip: For a 30ml bottle, 6-9 drops total gives ~1% dilution (safe for face)
			</p>
		</div>

		<!-- Submit -->
		<div class="flex gap-3">
			<button
				type="submit"
				disabled={isSubmitting || !name.trim() || selectedCarriers.length === 0}
				class="btn-vintage flex-1 disabled:opacity-50"
			>
				{isSubmitting ? 'Creating...' : 'Create Formula'}
			</button>
			<a href={resolve('/formulations')} class="btn-outline flex-1 text-center">Cancel</a>
		</div>
	</form>
</div>
