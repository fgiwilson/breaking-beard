<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps, ActionData } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let showForm = $state(false);
	let editingOil = $state<(typeof data.oils)[0] | null>(null);

	function startEdit(oil: (typeof data.oils)[0]) {
		editingOil = oil;
		showForm = true;
	}

	function cancelForm() {
		showForm = false;
		editingOil = null;
	}

	const absorptionOptions = ['fast', 'medium', 'slow'];
	const textureOptions = ['light', 'medium', 'heavy'];
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-end justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold tracking-wide text-parchment-200">Carrier Oils</h1>
			<p class="mt-1 font-display text-sm text-parchment-600 italic">Your base oil inventory</p>
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
					{editingOil ? 'Edit' : 'Add'} Carrier Oil
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
						<label for="name" class="mb-1 block text-sm font-medium text-parchment-400">Name</label>
						<input
							type="text"
							id="name"
							name="name"
							value={editingOil?.name ?? ''}
							required
							class="w-full"
							placeholder="e.g., Jojoba"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="comedogenic" class="mb-1 block text-sm font-medium text-parchment-400">
								Comedogenic (0-5)
							</label>
							<input
								type="number"
								id="comedogenic"
								name="comedogenic"
								min="0"
								max="5"
								value={editingOil?.comedogenic ?? ''}
								class="w-full"
							/>
						</div>
						<div>
							<label for="absorption" class="mb-1 block text-sm font-medium text-parchment-400">
								Absorption
							</label>
							<select id="absorption" name="absorption" class="w-full">
								<option value="">Select...</option>
								{#each absorptionOptions as opt (opt)}
									<option value={opt} selected={editingOil?.absorption === opt}>
										{opt.charAt(0).toUpperCase() + opt.slice(1)}
									</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="texture" class="mb-1 block text-sm font-medium text-parchment-400">
								Texture
							</label>
							<select id="texture" name="texture" class="w-full">
								<option value="">Select...</option>
								{#each textureOptions as opt (opt)}
									<option value={opt} selected={editingOil?.texture === opt}>
										{opt.charAt(0).toUpperCase() + opt.slice(1)}
									</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="vitamins" class="mb-1 block text-sm font-medium text-parchment-400">
								Vitamins
							</label>
							<input
								type="text"
								id="vitamins"
								name="vitamins"
								value={editingOil?.vitamins ?? ''}
								class="w-full"
								placeholder="e.g., A, E"
							/>
						</div>
					</div>

					<div>
						<label for="notes" class="mb-1 block text-sm font-medium text-parchment-400"
							>Notes</label
						>
						<textarea
							id="notes"
							name="notes"
							rows="3"
							class="w-full"
							placeholder="Your notes about this oil...">{editingOil?.notes ?? ''}</textarea
						>
					</div>

					<div class="flex gap-3">
						<button type="submit" class="btn-vintage flex-1">
							{editingOil ? 'Update' : 'Add'} Oil
						</button>
						<button type="button" onclick={cancelForm} class="btn-outline flex-1"> Cancel </button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Oil List -->
	{#if data.oils.length === 0}
		<div class="v-card p-8 text-center">
			<i class="fa-duotone fa-solid fa-droplet text-4xl text-ink-500"></i>
			<p class="mt-3 text-sm text-parchment-600">No carrier oils in your inventory yet</p>
			<button onclick={() => (showForm = true)} class="btn-vintage mt-4 text-sm">
				Add your first oil
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.oils as oil (oil.id)}
				<div class="v-card p-4">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="font-display text-lg font-semibold text-parchment-200">{oil.name}</h3>
							<div class="mt-1 flex flex-wrap gap-2 text-xs">
								{#if oil.absorption}
									<span
										class="rounded-md border border-amber-500/15 bg-ink-600 px-2 py-0.5 text-parchment-500"
									>
										{oil.absorption} absorption
									</span>
								{/if}
								{#if oil.texture}
									<span
										class="rounded-md border border-amber-500/15 bg-ink-600 px-2 py-0.5 text-parchment-500"
									>
										{oil.texture} texture
									</span>
								{/if}
								{#if oil.comedogenic !== null}
									<span
										class="rounded-md border border-amber-500/15 bg-ink-600 px-2 py-0.5 text-parchment-500"
									>
										comedogenic: {oil.comedogenic}
									</span>
								{/if}
							</div>
						</div>
						<div class="flex gap-1">
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

					{#if oil.vitamins}
						<p class="mt-2 text-xs text-parchment-600">
							<span class="font-medium text-parchment-500">Vitamins:</span>
							{oil.vitamins}
						</p>
					{/if}

					{#if oil.notes}
						<p class="mt-2 text-sm text-parchment-500">{oil.notes}</p>
					{/if}

					{#if oil._count.formulations > 0}
						<p class="mt-2 text-xs text-parchment-700">
							Used in {oil._count.formulations} formula{oil._count.formulations !== 1 ? 's' : ''}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
