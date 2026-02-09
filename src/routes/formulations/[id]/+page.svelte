<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let isEditing = $state(false);
	let isEditingOils = $state(false);
	let showTestLogForm = $state(false);
	let showDeleteConfirm = $state(false);

	// Editing states - initialized empty, synced via $effect
	let editName = $state('');
	let editPurpose = $state('');
	let editVolume = $state(30);
	let editNotes = $state('');

	// Oil editing states - initialized empty, synced via $effect
	let selectedCarriers = $state<Array<{ id: string; percentage: number }>>([]);
	let selectedEssentials = $state<Array<{ id: string; drops: number }>>([]);

	// Sync edit states when entering edit mode or when data changes
	$effect(() => {
		if (isEditing) {
			editName = data.formulation.name;
			editPurpose = data.formulation.purpose ?? '';
			editVolume = data.formulation.totalVolumeMl ?? 30;
			editNotes = data.formulation.notes ?? '';
		}
	});

	$effect(() => {
		if (isEditingOils) {
			selectedCarriers = data.formulation.carrierOils.map((co) => ({
				id: co.carrierOilId,
				percentage: co.percentage
			}));
			selectedEssentials = data.formulation.essentialOils.map((eo) => ({
				id: eo.essentialOilId,
				drops: eo.drops ?? 0
			}));
		}
	});

	// Test log state
	let testNotes = $state('');
	let testRating = $state<number | null>(null);

	let totalCarrierPct = $derived(selectedCarriers.reduce((sum, c) => sum + c.percentage, 0));
	let totalDrops = $derived(selectedEssentials.reduce((sum, e) => sum + e.drops, 0));
	let totalEoPct = $derived(
		data.formulation.totalVolumeMl
			? ((totalDrops * 0.05) / data.formulation.totalVolumeMl) * 100
			: 0
	);

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'short',
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
			earthy: 'badge-earthy',
			resinous: 'bg-amber-700 text-white'
		};
		return map[category?.toLowerCase() ?? ''] ?? 'bg-amber-200 text-leather-800';
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

	async function saveOils() {
		const formData = new FormData();
		formData.append('carrierOils', JSON.stringify(selectedCarriers));
		formData.append('essentialOils', JSON.stringify(selectedEssentials));

		const response = await fetch(`/formulations/${data.formulation.id}?/updateOils`, {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			isEditingOils = false;
			window.location.reload();
		}
	}

	function cancelEdit() {
		isEditing = false;
		editName = data.formulation.name;
		editPurpose = data.formulation.purpose ?? '';
		editVolume = data.formulation.totalVolumeMl ?? 30;
		editNotes = data.formulation.notes ?? '';
	}

	function cancelOilEdit() {
		isEditingOils = false;
		selectedCarriers = data.formulation.carrierOils.map((co) => ({
			id: co.carrierOilId,
			percentage: co.percentage
		}));
		selectedEssentials = data.formulation.essentialOils.map((eo) => ({
			id: eo.essentialOilId,
			drops: eo.drops ?? 0
		}));
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<a href={resolve('/formulations')} class="text-sm text-amber-600 hover:text-amber-700"
				>&larr; Formulas</a
			>
			<h1 class="mt-1 font-display text-2xl font-bold text-leather-900 lg:text-3xl">
				{data.formulation.name}
			</h1>
			<div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-amber-600">
				{#if data.formulation.purpose}
					<span class="rounded-full bg-amber-100 px-2 py-0.5 capitalize">
						{data.formulation.purpose}
					</span>
				{/if}
				{#if data.formulation.totalVolumeMl}
					<span>{data.formulation.totalVolumeMl}ml batch</span>
				{/if}
				<span>{data.formulation.testLogs.length} tests</span>
			</div>
		</div>
		<div class="flex gap-2">
			<button
				onclick={() => (isEditing = true)}
				class="rounded-lg bg-amber-100 p-2 text-amber-700 transition hover:bg-amber-200"
				aria-label="Edit formula"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
			</button>
			<button
				onclick={() => (showDeleteConfirm = true)}
				class="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
				aria-label="Delete formula"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Edit Modal -->
	{#if isEditing}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-leather-900/50 p-4">
			<div class="card-glass max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6">
				<h2 class="mb-4 font-display text-xl font-semibold text-leather-900">Edit Formula</h2>

				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								isEditing = false;
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-leather-800">Name</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={editName}
							required
							class="w-full"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="purpose" class="mb-1 block text-sm font-medium text-leather-800">
								Purpose
							</label>
							<select id="purpose" name="purpose" bind:value={editPurpose} class="w-full">
								<option value="">Select...</option>
								<option value="morning">Morning</option>
								<option value="evening">Evening</option>
								<option value="all-day">All-Day</option>
							</select>
						</div>
						<div>
							<label for="volume" class="mb-1 block text-sm font-medium text-leather-800">
								Batch (ml)
							</label>
							<input
								type="number"
								id="volume"
								name="totalVolumeMl"
								bind:value={editVolume}
								min="5"
								max="100"
								class="w-full"
							/>
						</div>
					</div>

					<div>
						<label for="notes" class="mb-1 block text-sm font-medium text-leather-800">Notes</label>
						<textarea id="notes" name="notes" bind:value={editNotes} rows="3" class="w-full"
						></textarea>
					</div>

					<div class="flex gap-3">
						<button type="submit" class="btn-vintage flex-1">Save</button>
						<button
							type="button"
							onclick={cancelEdit}
							class="flex-1 rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-leather-700 transition hover:bg-amber-50"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-leather-900/50 p-4">
			<div class="card-glass w-full max-w-sm rounded-xl p-6">
				<h2 class="mb-2 font-display text-xl font-semibold text-leather-900">Delete Formula?</h2>
				<p class="text-leather-600 mb-4 text-sm">
					This will permanently delete "{data.formulation.name}" and all its test logs.
				</p>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								goto(resolve('/formulations'));
							}
						};
					}}
					class="flex gap-3"
				>
					<button
						type="submit"
						class="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
					>
						Delete
					</button>
					<button
						type="button"
						onclick={() => (showDeleteConfirm = false)}
						class="flex-1 rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-leather-700 transition hover:bg-amber-50"
					>
						Cancel
					</button>
				</form>
			</div>
		</div>
	{/if}

	<!-- Notes -->
	{#if data.formulation.notes}
		<div class="card-glass rounded-xl p-4">
			<p class="text-sm text-leather-700">{data.formulation.notes}</p>
		</div>
	{/if}

	<!-- Recipe -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Carrier Oils -->
		<div class="card-glass rounded-xl p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-leather-900">Carrier Base</h2>
				{#if !isEditingOils}
					<button
						onclick={() => (isEditingOils = true)}
						class="text-sm text-amber-600 hover:text-amber-700"
					>
						Edit
					</button>
				{/if}
			</div>

			{#if isEditingOils}
				<div class="space-y-3">
					{#each selectedCarriers as carrier, i (carrier.id)}
						<div class="flex items-center gap-3 rounded-lg bg-amber-50 p-2">
							<span class="flex-1 text-sm font-medium text-leather-800">
								{getCarrierName(carrier.id)}
							</span>
							<input
								type="number"
								bind:value={selectedCarriers[i].percentage}
								min="0"
								max="100"
								class="w-20 text-center text-sm"
							/>
							<span class="text-sm text-amber-600">%</span>
							<button
								type="button"
								onclick={() => removeCarrier(carrier.id)}
								class="text-red-400 hover:text-red-600"
								aria-label="Remove {getCarrierName(carrier.id)}"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					{/each}

					<div class="flex flex-wrap gap-2">
						{#each data.carrierOils.filter((o) => !selectedCarriers.find((c) => c.id === o.id)) as oil (oil.id)}
							<button
								type="button"
								onclick={() => addCarrier(oil.id)}
								class="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700 transition hover:bg-amber-200"
							>
								+ {oil.name}
							</button>
						{/each}
					</div>

					<div class="flex items-center justify-between pt-2 text-sm">
						<span
							class:text-green-600={totalCarrierPct === 100}
							class:text-amber-600={totalCarrierPct !== 100}
						>
							Total: {totalCarrierPct}%
						</span>
						<div class="flex gap-2">
							<button onclick={saveOils} class="btn-vintage text-sm">Save</button>
							<button onclick={cancelOilEdit} class="text-amber-600 hover:text-amber-700"
								>Cancel</button
							>
						</div>
					</div>
				</div>
			{:else if data.formulation.carrierOils.length === 0}
				<p class="text-sm text-amber-600">No carrier oils added</p>
			{:else}
				<div class="space-y-2">
					{#each data.formulation.carrierOils as co (co.id)}
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-leather-800">{co.carrierOil.name}</span>
							<span class="text-sm text-amber-600">{co.percentage}%</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Essential Oils -->
		<div class="card-glass rounded-xl p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-leather-900">Essential Oils</h2>
				{#if !isEditingOils}
					<button
						onclick={() => (isEditingOils = true)}
						class="text-sm text-amber-600 hover:text-amber-700"
					>
						Edit
					</button>
				{/if}
			</div>

			{#if isEditingOils}
				<div class="space-y-3">
					{#each selectedEssentials as essential, i (essential.id)}
						<div class="flex items-center gap-3 rounded-lg bg-amber-50 p-2">
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
									getScentCategory(essential.id)
								)}"
							>
								{getScentCategory(essential.id) || '?'}
							</span>
							<span class="flex-1 text-sm font-medium text-leather-800">
								{getEssentialName(essential.id)}
							</span>
							<input
								type="number"
								bind:value={selectedEssentials[i].drops}
								min="0"
								max="20"
								class="w-16 text-center text-sm"
							/>
							<span class="text-sm text-amber-600">drops</span>
							<button
								type="button"
								onclick={() => removeEssential(essential.id)}
								class="text-red-400 hover:text-red-600"
								aria-label="Remove {getEssentialName(essential.id)}"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					{/each}

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

					<p class="pt-2 text-xs text-amber-600">
						{totalDrops} drops total = ~{totalEoPct.toFixed(1)}% dilution
					</p>
				</div>
			{:else if data.formulation.essentialOils.length === 0}
				<p class="text-sm text-amber-600">No essential oils added</p>
			{:else}
				<div class="space-y-2">
					{#each data.formulation.essentialOils as eo (eo.id)}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
										eo.essentialOil.scentCategory
									)}"
								>
									{eo.essentialOil.scentCategory || '?'}
								</span>
								<span class="text-sm font-medium text-leather-800">{eo.essentialOil.name}</span>
							</div>
							<span class="text-sm text-amber-600">
								{eo.drops} drops
								{#if eo.percentage}
									<span class="text-xs">({eo.percentage.toFixed(1)}%)</span>
								{/if}
							</span>
						</div>
					{/each}
				</div>
				{#if data.formulation.totalVolumeMl}
					{@const totalDropsDisplay = data.formulation.essentialOils.reduce(
						(sum, eo) => sum + (eo.drops ?? 0),
						0
					)}
					{@const totalPct = ((totalDropsDisplay * 0.05) / data.formulation.totalVolumeMl) * 100}
					<p class="mt-3 border-t border-amber-100 pt-3 text-xs text-amber-600">
						{totalDropsDisplay} drops total = ~{totalPct.toFixed(1)}% dilution
					</p>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Test Logs -->
	<div class="card-glass rounded-xl p-4">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-display text-lg font-semibold text-leather-900">Test Log</h2>
			<button onclick={() => (showTestLogForm = !showTestLogForm)} class="btn-vintage text-sm">
				{showTestLogForm ? 'Cancel' : '+ Add Test'}
			</button>
		</div>

		{#if showTestLogForm}
			<form
				method="POST"
				action="?/addTestLog"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							showTestLogForm = false;
							testNotes = '';
							testRating = null;
						}
						await update();
					};
				}}
				class="mb-4 space-y-3 rounded-lg bg-amber-50 p-4"
			>
				<div>
					<label for="testNotes" class="mb-1 block text-sm font-medium text-leather-800">
						How did it go?
					</label>
					<textarea
						id="testNotes"
						name="notes"
						bind:value={testNotes}
						required
						rows="3"
						class="w-full"
						placeholder="Describe the scent, feel, longevity..."
					></textarea>
				</div>

				<div>
					<span id="rating-label" class="mb-2 block text-sm font-medium text-leather-800"
						>Rating</span
					>
					<div class="flex gap-1" role="group" aria-labelledby="rating-label">
						{#each [1, 2, 3, 4, 5] as star (star)}
							<button
								type="button"
								onclick={() => (testRating = testRating === star ? null : star)}
								class="star text-2xl transition hover:scale-110"
								class:filled={testRating !== null && star <= testRating}
								aria-label="{star} star{star > 1 ? 's' : ''}"
								aria-pressed={testRating !== null && star <= testRating}
							>
								<svg viewBox="0 0 20 20" fill="currentColor" class="h-6 w-6">
									<path
										d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
									/>
								</svg>
							</button>
						{/each}
					</div>
					<input type="hidden" name="rating" value={testRating ?? ''} />
				</div>

				<button type="submit" class="btn-vintage w-full">Save Test</button>
			</form>
		{/if}

		{#if data.formulation.testLogs.length === 0}
			<p class="py-4 text-center text-sm text-amber-600">
				No tests yet. Try out this formula and log your experience!
			</p>
		{:else}
			<div class="space-y-4">
				{#each data.formulation.testLogs as log (log.id)}
					<div class="diary-entry group relative">
						<div class="flex items-start justify-between gap-2">
							<div class="flex-1">
								<p class="text-xs text-amber-600">{formatDate(log.date)}</p>
								<p class="mt-1 text-sm text-leather-700">{log.notes}</p>
							</div>
							<div class="flex items-center gap-2">
								{#if log.rating}
									<div class="rating">
										{#each [1, 2, 3, 4, 5] as star (star)}
											<svg
												class="star h-4 w-4"
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
								<form
									method="POST"
									action="?/deleteTestLog"
									use:enhance
									class="opacity-0 transition group-hover:opacity-100"
								>
									<input type="hidden" name="id" value={log.id} />
									<button
										type="submit"
										class="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
										aria-label="Delete test log"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</form>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
