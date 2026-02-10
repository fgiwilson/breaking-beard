<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps, ActionData } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let showForm = $state(false);
	let showPairingForm = $state(false);
	let editingOil = $state<(typeof data.oils)[0] | null>(null);
	let pairingOil = $state<(typeof data.oils)[0] | null>(null);

	const scentCategories = ['citrus', 'woody', 'herbal', 'floral', 'spicy', 'earthy', 'resinous'];

	function startEdit(oil: (typeof data.oils)[0]) {
		editingOil = oil;
		showForm = true;
	}

	function startPairing(oil: (typeof data.oils)[0]) {
		pairingOil = oil;
		showPairingForm = true;
	}

	function cancelForm() {
		showForm = false;
		editingOil = null;
	}

	function cancelPairingForm() {
		showPairingForm = false;
		pairingOil = null;
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

	function getPairings(oil: (typeof data.oils)[0]) {
		const pairs: Array<{ id: string; oil: { id: string; name: string }; notes: string | null }> =
			[];

		for (const p of oil.pairings) {
			pairs.push({ id: p.id, oil: p.oil2, notes: p.notes });
		}
		for (const p of oil.pairedWith) {
			pairs.push({ id: p.id, oil: p.oil1, notes: p.notes });
		}

		return pairs;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-end justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold tracking-wide text-parchment-200">
				Essential Oils
			</h1>
			<p class="mt-1 font-display text-sm italic text-parchment-600">Your scent library</p>
		</div>
		<button onclick={() => (showForm = true)} class="btn-vintage">
			<span class="flex items-center gap-2">
				<i class="fa-sharp fa-solid fa-plus"></i>
				Add Oil
			</span>
		</button>
	</div>

	<!-- Form Modal -->
	{#if showForm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4">
			<div
				class="scoop-lg w-full max-w-md overflow-y-auto border border-amber-500/15 bg-ink-700 p-6"
				style="max-height: 90vh;"
			>
				<h2 class="mb-4 font-display text-xl font-semibold text-parchment-200">
					{editingOil ? 'Edit' : 'Add'} Essential Oil
				</h2>

				{#if form?.error}
					<div class="scoop-sm mb-4 bg-red-500/15 p-3 text-sm text-red-400">
						{form.error}
					</div>
				{/if}

				<form
					method="POST"
					action={editingOil ? '?/update' : '?/create'}
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								cancelForm();
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					{#if editingOil}
						<input type="hidden" name="id" value={editingOil.id} />
					{/if}

					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-parchment-400"
							>Name</label
						>
						<input
							type="text"
							id="name"
							name="name"
							value={editingOil?.name ?? ''}
							required
							class="w-full"
							placeholder="e.g., Bergamot"
						/>
					</div>

					<div>
						<label
							for="scentCategory"
							class="mb-1 block text-sm font-medium text-parchment-400"
						>
							Scent Category
						</label>
						<select id="scentCategory" name="scentCategory" class="w-full">
							<option value="">Select...</option>
							{#each scentCategories as cat (cat)}
								<option value={cat} selected={editingOil?.scentCategory === cat}>
									{cat.charAt(0).toUpperCase() + cat.slice(1)}
								</option>
							{/each}
						</select>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="minDrops" class="mb-1 block text-sm font-medium text-parchment-400">
								Min Drops
							</label>
							<input
								type="number"
								id="minDrops"
								name="minDrops"
								step="1"
								min="0"
								value={editingOil?.minDrops ?? ''}
								class="w-full"
							/>
						</div>
						<div>
							<label for="maxDrops" class="mb-1 block text-sm font-medium text-parchment-400">
								Max Drops
							</label>
							<input
								type="number"
								id="maxDrops"
								name="maxDrops"
								step="1"
								min="0"
								value={editingOil?.maxDrops ?? ''}
								class="w-full"
							/>
						</div>
					</div>

					<div>
						<label for="safetyNotes" class="mb-1 block text-sm font-medium text-parchment-400">
							Safety Notes
						</label>
						<input
							type="text"
							id="safetyNotes"
							name="safetyNotes"
							value={editingOil?.safetyNotes ?? ''}
							class="w-full"
							placeholder="e.g., phototoxic - avoid sun exposure"
						/>
					</div>

					<div>
						<label for="notes" class="mb-1 block text-sm font-medium text-parchment-400">
							Personal Notes
						</label>
						<textarea
							id="notes"
							name="notes"
							rows="3"
							class="w-full"
							placeholder="Your notes about this oil's scent, uses, etc."
							>{editingOil?.notes ?? ''}</textarea
						>
					</div>

					<div class="flex gap-3">
						<button type="submit" class="btn-vintage flex-1">
							{editingOil ? 'Update' : 'Add'} Oil
						</button>
						<button type="button" onclick={cancelForm} class="btn-outline flex-1">
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Pairing Modal -->
	{#if showPairingForm && pairingOil}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4">
			<div
				class="scoop-lg w-full max-w-md overflow-y-auto border border-amber-500/15 bg-ink-700 p-6"
				style="max-height: 90vh;"
			>
				<h2 class="mb-4 font-display text-xl font-semibold text-parchment-200">
					Pair with {pairingOil.name}
				</h2>

				<form
					method="POST"
					action="?/addPairing"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								cancelPairingForm();
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					<input type="hidden" name="oil1Id" value={pairingOil.id} />

					<div>
						<label for="oil2Id" class="mb-1 block text-sm font-medium text-parchment-400">
							Pairs well with
						</label>
						<select id="oil2Id" name="oil2Id" class="w-full" required>
							<option value="">Select an oil...</option>
							{#each data.oils.filter((o) => o.id !== pairingOil?.id && !getPairings(pairingOil!).some((p) => p.oil.id === o.id)) as oil (oil.id)}
								<option value={oil.id}>
									{oil.name}
									{oil.scentCategory ? `(${oil.scentCategory})` : ''}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="pairingNotes"
							class="mb-1 block text-sm font-medium text-parchment-400"
						>
							Notes (optional)
						</label>
						<input
							type="text"
							id="pairingNotes"
							name="notes"
							class="w-full"
							placeholder="e.g., creates a fresh citrus blend"
						/>
					</div>

					<div class="flex gap-3">
						<button type="submit" class="btn-vintage flex-1">Add Pairing</button>
						<button type="button" onclick={cancelPairingForm} class="btn-outline flex-1">
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Oil List -->
	{#if data.oils.length === 0}
		<div class="v-card p-8 text-center">
			<i class="fa-duotone fa-solid fa-flask text-4xl text-ink-500"></i>
			<p class="mt-3 text-sm text-parchment-600">No essential oils in your library yet</p>
			<button onclick={() => (showForm = true)} class="btn-vintage mt-4 text-sm">
				Add your first oil
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.oils as oil (oil.id)}
				{@const pairings = getPairings(oil)}
				<div class="v-card p-4">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="font-display text-lg font-semibold text-parchment-200">{oil.name}</h3>
							{#if oil.scentCategory}
								<span
									class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
										oil.scentCategory
									)}"
								>
									{oil.scentCategory}
								</span>
							{/if}
						</div>
						<div class="flex gap-1">
							<button
								onclick={() => startPairing(oil)}
								class="scoop-sm p-1.5 text-parchment-600 transition hover:bg-ink-500 hover:text-amber-400"
								aria-label="Add pairing for {oil.name}"
								title="Add pairing"
							>
								<i class="fa-sharp fa-regular fa-link-simple"></i>
							</button>
							<button
								onclick={() => startEdit(oil)}
								class="scoop-sm p-1.5 text-parchment-600 transition hover:bg-ink-500 hover:text-amber-400"
								aria-label="Edit {oil.name}"
							>
								<i class="fa-sharp fa-regular fa-pen-to-square"></i>
							</button>
							{#if oil._count.formulations === 0}
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={oil.id} />
									<button
										type="submit"
										class="scoop-sm p-1.5 text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400"
										aria-label="Delete {oil.name}"
									>
										<i class="fa-sharp fa-regular fa-trash-can"></i>
									</button>
								</form>
							{/if}
						</div>
					</div>

					{#if oil.minDrops !== null || oil.maxDrops !== null}
						<p class="mt-2 text-xs text-parchment-600">
							<span class="font-medium text-parchment-500">Drops (per 30ml):</span>
							{oil.minDrops ?? 0} - {oil.maxDrops ?? '?'}
						</p>
					{/if}

					{#if oil.safetyNotes}
						<p class="mt-2 text-xs text-red-400">
							<span class="font-medium">Safety:</span>
							{oil.safetyNotes}
						</p>
					{/if}

					{#if oil.notes}
						<p class="mt-2 text-sm text-parchment-500">{oil.notes}</p>
					{/if}

					{#if pairings.length > 0}
						<div class="mt-3 border-t border-amber-500/10 pt-3">
							<p class="text-xs font-medium text-parchment-600">Pairs well with:</p>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each pairings as pairing (pairing.id)}
									<form method="POST" action="?/removePairing" use:enhance class="inline">
										<input type="hidden" name="id" value={pairing.id} />
										<button
											type="submit"
											class="group flex items-center gap-1 rounded-full bg-ink-600 px-2 py-0.5 text-xs text-parchment-500 transition hover:bg-red-500/15 hover:text-red-400"
											title={pairing.notes || 'Click to remove'}
										>
											{pairing.oil.name}
											<i
												class="fa-sharp fa-solid fa-xmark text-[0.6rem] opacity-0 transition group-hover:opacity-100"
											></i>
										</button>
									</form>
								{/each}
							</div>
						</div>
					{/if}

					{#if oil._count.formulations > 0}
						<p class="mt-2 text-xs text-parchment-700">
							Used in {oil._count.formulations} formula{oil._count.formulations !== 1
								? 's'
								: ''}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
