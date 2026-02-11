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
	let editStatus = $state('not-tested');
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
			editStatus = data.formulation.status;
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

	function getStatusBadgeClass(status: string): string {
		const map: Record<string, string> = {
			'not-tested': 'badge-status-untested',
			cottonball: 'badge-status-cottonball',
			carrier: 'badge-status-carrier',
			final: 'badge-status-final'
		};
		return map[status] ?? 'badge-status-untested';
	}

	function getStatusLabel(status: string): string {
		const map: Record<string, string> = {
			'not-tested': 'Not Tested',
			cottonball: 'Cottonball',
			carrier: 'Carrier',
			final: 'Final'
		};
		return map[status] ?? status;
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
		editStatus = data.formulation.status;
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
			<a
				href={resolve('/formulations')}
				class="font-display text-sm text-amber-600 transition hover:text-amber-400"
				>&larr; Formulary</a
			>
			<div class="mt-1 flex items-center gap-2">
				<h1 class="font-display text-2xl font-bold tracking-wide text-parchment-200 lg:text-3xl">
					{data.formulation.name}
				</h1>
				{#if data.formulation.melissaApproved}
					<i class="fa-solid fa-heart text-sm text-rose-400" title="Melissa Approved"></i>
				{/if}
			</div>
			<div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-parchment-600">
				{#if data.formulation.purpose}
					<span
						class="scoop-xs border border-amber-500/15 bg-ink-600 px-2 py-0.5 text-xs capitalize"
					>
						{data.formulation.purpose}
					</span>
				{/if}
				<span
					class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusBadgeClass(
						data.formulation.status
					)}"
				>
					{getStatusLabel(data.formulation.status)}
				</span>
				{#if data.formulation.totalVolumeMl}
					<span>{data.formulation.totalVolumeMl}ml batch</span>
				{/if}
				<span>{data.formulation.testLogs.length} tests</span>
			</div>
		</div>
		<div class="flex gap-2">
			<form method="POST" action="?/toggleMelissaApproved" use:enhance>
				<button
					type="submit"
					class="scoop-sm p-2 transition {data.formulation.melissaApproved
						? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
						: 'bg-ink-600 text-parchment-500 hover:bg-ink-500 hover:text-rose-400'}"
					aria-label="{data.formulation.melissaApproved ? 'Remove' : 'Add'} Melissa approval"
					title="{data.formulation.melissaApproved ? 'Remove' : 'Add'} Melissa Approved"
				>
					<i class="fa-heart {data.formulation.melissaApproved ? 'fa-solid' : 'fa-regular'}"></i>
				</button>
			</form>
			<button
				onclick={() => (isEditing = true)}
				class="scoop-sm bg-ink-600 p-2 text-parchment-500 transition hover:bg-ink-500 hover:text-amber-400"
				aria-label="Edit formula"
			>
				<i class="fa-sharp fa-regular fa-pen-to-square"></i>
			</button>
			<button
				onclick={() => (showDeleteConfirm = true)}
				class="scoop-sm bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
				aria-label="Delete formula"
			>
				<i class="fa-sharp fa-regular fa-trash-can"></i>
			</button>
		</div>
	</div>

	<!-- Edit Modal -->
	{#if isEditing}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4">
			<div
				class="scoop-lg w-full max-w-md overflow-y-auto border border-amber-500/15 bg-ink-700 p-6"
				style="max-height: 90vh;"
			>
				<h2 class="mb-4 font-display text-xl font-semibold text-parchment-200">Edit Formula</h2>

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
						<label for="name" class="mb-1 block text-sm font-medium text-parchment-400">Name</label>
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
							<label for="purpose" class="mb-1 block text-sm font-medium text-parchment-400">
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
							<label for="status" class="mb-1 block text-sm font-medium text-parchment-400">
								Status
							</label>
							<select id="status" name="status" bind:value={editStatus} class="w-full">
								<option value="not-tested">Not Tested</option>
								<option value="cottonball">Cottonball Tested</option>
								<option value="carrier">Carrier Oil Tested</option>
								<option value="final">Final</option>
							</select>
						</div>
					</div>

					<div>
						<label for="volume" class="mb-1 block text-sm font-medium text-parchment-400">
							Batch Size (ml)
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

					<div>
						<label for="notes" class="mb-1 block text-sm font-medium text-parchment-400"
							>Notes</label
						>
						<textarea id="notes" name="notes" bind:value={editNotes} rows="3" class="w-full"
						></textarea>
					</div>

					<div class="flex gap-3">
						<button type="submit" class="btn-vintage flex-1">Save</button>
						<button type="button" onclick={cancelEdit} class="btn-outline flex-1"> Cancel </button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4">
			<div class="scoop-lg w-full max-w-sm border border-amber-500/15 bg-ink-700 p-6">
				<h2 class="mb-2 font-display text-xl font-semibold text-parchment-200">Delete Formula?</h2>
				<p class="mb-4 text-sm text-parchment-500">
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
						class="scoop-sm flex-1 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
					>
						Delete
					</button>
					<button
						type="button"
						onclick={() => (showDeleteConfirm = false)}
						class="btn-outline flex-1"
					>
						Cancel
					</button>
				</form>
			</div>
		</div>
	{/if}

	<!-- Notes -->
	{#if data.formulation.notes}
		<div class="v-card p-5">
			<p class="text-sm text-parchment-400">{data.formulation.notes}</p>
		</div>
	{/if}

	<!-- Recipe -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Carrier Oils -->
		<div class="v-card p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-parchment-200">Carrier Base</h2>
				{#if !isEditingOils}
					<button
						onclick={() => (isEditingOils = true)}
						class="font-display text-sm text-amber-600 transition hover:text-amber-400"
					>
						Edit
					</button>
				{/if}
			</div>

			{#if isEditingOils}
				<div class="space-y-3">
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

					<div class="flex items-center justify-between pt-2 text-sm">
						<span
							class:text-sage-300={totalCarrierPct === 100}
							class:text-parchment-600={totalCarrierPct !== 100}
						>
							Total: {totalCarrierPct}%
						</span>
						<div class="flex gap-2">
							<button onclick={saveOils} class="btn-vintage text-sm">Save</button>
							<button
								onclick={cancelOilEdit}
								class="font-display text-sm text-amber-600 hover:text-amber-400">Cancel</button
							>
						</div>
					</div>
				</div>
			{:else if data.formulation.carrierOils.length === 0}
				<p class="text-sm text-parchment-600">No carrier oils added</p>
			{:else}
				<div class="space-y-2">
					{#each data.formulation.carrierOils as co (co.id)}
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-parchment-300">{co.carrierOil.name}</span>
							<span class="font-display text-sm text-amber-500">{co.percentage}%</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Essential Oils -->
		<div class="v-card p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-lg font-semibold text-parchment-200">Essential Oils</h2>
				{#if !isEditingOils}
					<button
						onclick={() => (isEditingOils = true)}
						class="font-display text-sm text-amber-600 transition hover:text-amber-400"
					>
						Edit
					</button>
				{/if}
			</div>

			{#if isEditingOils}
				<div class="space-y-3">
					{#each selectedEssentials as essential, i (essential.id)}
						<div class="flex items-center gap-3 rounded-lg bg-ink-600 p-2">
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
									getScentCategory(essential.id)
								)}"
							>
								{getScentCategory(essential.id) || '?'}
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

					<p class="pt-2 text-xs text-parchment-600">
						{totalDrops} drops total = ~{totalEoPct.toFixed(1)}% dilution
					</p>
				</div>
			{:else if data.formulation.essentialOils.length === 0}
				<p class="text-sm text-parchment-600">No essential oils added</p>
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
								<span class="text-sm font-medium text-parchment-300">{eo.essentialOil.name}</span>
							</div>
							<span class="font-display text-sm text-amber-500">
								{eo.drops} drops
								{#if eo.percentage}
									<span class="text-xs text-parchment-600">({eo.percentage.toFixed(1)}%)</span>
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
					<div class="ornament-divider mt-3">&mdash;&#10022;&mdash;</div>
					<p class="text-center text-xs text-parchment-600">
						{totalDropsDisplay} drops total = ~{totalPct.toFixed(1)}% dilution
					</p>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Test Logs -->
	<div class="v-card p-5">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-display text-lg font-semibold text-parchment-200">Test Log</h2>
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
				class="mb-4 space-y-3 rounded-lg border border-amber-500/10 bg-ink-600 p-4"
			>
				<div>
					<label for="testNotes" class="mb-1 block text-sm font-medium text-parchment-400">
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
					<span id="rating-label" class="mb-2 block text-sm font-medium text-parchment-400"
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
								<i
									class="{testRating !== null && star <= testRating
										? 'fa-sharp-duotone fa-solid fa-star'
										: 'fa-sharp-duotone fa-regular fa-star'} text-2xl"
								></i>
							</button>
						{/each}
					</div>
					<input type="hidden" name="rating" value={testRating ?? ''} />
				</div>

				<button type="submit" class="btn-vintage w-full">Save Test</button>
			</form>
		{/if}

		{#if data.formulation.testLogs.length === 0}
			<p class="py-4 text-center text-sm text-parchment-600">
				No tests yet. Try out this formula and log your experience!
			</p>
		{:else}
			<div class="space-y-4">
				{#each data.formulation.testLogs as log (log.id)}
					<div class="diary-entry group relative">
						<div class="flex items-start justify-between gap-2">
							<div class="flex-1">
								<p class="text-xs text-parchment-600">{formatDate(log.date)}</p>
								<p class="mt-1 text-sm text-parchment-400">{log.notes}</p>
							</div>
							<div class="flex items-center gap-2">
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
								<form
									method="POST"
									action="?/deleteTestLog"
									use:enhance
									class="opacity-0 transition group-hover:opacity-100"
								>
									<input type="hidden" name="id" value={log.id} />
									<button
										type="submit"
										class="rounded p-1 text-red-400/50 transition hover:text-red-400"
										aria-label="Delete test log"
									>
										<i class="fa-sharp fa-solid fa-xmark"></i>
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
