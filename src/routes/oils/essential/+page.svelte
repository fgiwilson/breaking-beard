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
			resinous: 'bg-amber-700 text-white'
		};
		return map[category?.toLowerCase() ?? ''] ?? 'bg-amber-200 text-leather-800';
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
			<h1 class="font-display text-2xl font-bold text-leather-900">Essential Oils</h1>
			<p class="mt-1 text-sm text-amber-700">Your scent library</p>
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
				Add Oil
			</span>
		</button>
	</div>

	<!-- Form Modal -->
	{#if showForm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-leather-900/50 p-4">
			<div class="card-glass max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6">
				<h2 class="mb-4 font-display text-xl font-semibold text-leather-900">
					{editingOil ? 'Edit' : 'Add'} Essential Oil
				</h2>

				{#if form?.error}
					<div class="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
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
						<label for="name" class="mb-1 block text-sm font-medium text-leather-800">Name</label>
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
						<label for="scentCategory" class="mb-1 block text-sm font-medium text-leather-800">
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
							<label for="minUsagePct" class="mb-1 block text-sm font-medium text-leather-800">
								Min Usage %
							</label>
							<input
								type="number"
								id="minUsagePct"
								name="minUsagePct"
								step="0.1"
								min="0"
								max="100"
								value={editingOil?.minUsagePct ?? ''}
								class="w-full"
							/>
						</div>
						<div>
							<label for="maxUsagePct" class="mb-1 block text-sm font-medium text-leather-800">
								Max Usage %
							</label>
							<input
								type="number"
								id="maxUsagePct"
								name="maxUsagePct"
								step="0.1"
								min="0"
								max="100"
								value={editingOil?.maxUsagePct ?? ''}
								class="w-full"
							/>
						</div>
					</div>

					<div>
						<label for="safetyNotes" class="mb-1 block text-sm font-medium text-leather-800">
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
						<label for="notes" class="mb-1 block text-sm font-medium text-leather-800">
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
						<button
							type="button"
							onclick={cancelForm}
							class="flex-1 rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-leather-700 transition hover:bg-amber-50"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Pairing Modal -->
	{#if showPairingForm && pairingOil}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-leather-900/50 p-4">
			<div class="card-glass max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6">
				<h2 class="mb-4 font-display text-xl font-semibold text-leather-900">
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
						<label for="oil2Id" class="mb-1 block text-sm font-medium text-leather-800">
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
						<label for="pairingNotes" class="mb-1 block text-sm font-medium text-leather-800">
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
						<button
							type="button"
							onclick={cancelPairingForm}
							class="flex-1 rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-leather-700 transition hover:bg-amber-50"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Oil List -->
	{#if data.oils.length === 0}
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
					d="M9 3v2m6-2v2M9 5h6m-7 4l-2 10h12l-2-10M8 9h8"
				/>
			</svg>
			<p class="mt-3 text-sm text-amber-700">No essential oils in your library yet</p>
			<button onclick={() => (showForm = true)} class="btn-vintage mt-4 text-sm">
				Add your first oil
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.oils as oil (oil.id)}
				{@const pairings = getPairings(oil)}
				<div class="card-glass rounded-xl p-4">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="font-display text-lg font-semibold text-leather-900">{oil.name}</h3>
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
								class="rounded p-1.5 text-amber-600 transition hover:bg-amber-100"
								aria-label="Add pairing for {oil.name}"
								title="Add pairing"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/>
								</svg>
							</button>
							<button
								onclick={() => startEdit(oil)}
								class="rounded p-1.5 text-amber-600 transition hover:bg-amber-100"
								aria-label="Edit {oil.name}"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>
							{#if oil._count.formulations === 0}
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={oil.id} />
									<button
										type="submit"
										class="rounded p-1.5 text-red-500 transition hover:bg-red-50"
										aria-label="Delete {oil.name}"
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
							{/if}
						</div>
					</div>

					{#if oil.minUsagePct !== null || oil.maxUsagePct !== null}
						<p class="mt-2 text-xs text-amber-600">
							<span class="font-medium">Usage:</span>
							{oil.minUsagePct ?? 0}% - {oil.maxUsagePct ?? '?'}%
						</p>
					{/if}

					{#if oil.safetyNotes}
						<p class="mt-2 text-xs text-red-600">
							<span class="font-medium">Safety:</span>
							{oil.safetyNotes}
						</p>
					{/if}

					{#if oil.notes}
						<p class="mt-2 text-sm text-leather-700">{oil.notes}</p>
					{/if}

					{#if pairings.length > 0}
						<div class="mt-3 border-t border-amber-100 pt-3">
							<p class="text-xs font-medium text-amber-700">Pairs well with:</p>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each pairings as pairing (pairing.id)}
									<form method="POST" action="?/removePairing" use:enhance class="inline">
										<input type="hidden" name="id" value={pairing.id} />
										<button
											type="submit"
											class="group flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 transition hover:bg-red-50 hover:text-red-600"
											title={pairing.notes || 'Click to remove'}
										>
											{pairing.oil.name}
											<svg
												class="h-3 w-3 opacity-0 transition group-hover:opacity-100"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</form>
								{/each}
							</div>
						</div>
					{/if}

					{#if oil._count.formulations > 0}
						<p class="mt-2 text-xs text-amber-600">
							Used in {oil._count.formulations} formula{oil._count.formulations !== 1 ? 's' : ''}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
