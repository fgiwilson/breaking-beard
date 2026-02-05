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
			<h1 class="font-display text-2xl font-bold text-leather-900">Carrier Oils</h1>
			<p class="mt-1 text-sm text-amber-700">Your base oil inventory</p>
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
					{editingOil ? 'Edit' : 'Add'} Carrier Oil
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
							placeholder="e.g., Jojoba"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="comedogenic" class="mb-1 block text-sm font-medium text-leather-800">
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
							<label for="absorption" class="mb-1 block text-sm font-medium text-leather-800">
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
							<label for="texture" class="mb-1 block text-sm font-medium text-leather-800">
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
							<label for="vitamins" class="mb-1 block text-sm font-medium text-leather-800">
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
						<label for="notes" class="mb-1 block text-sm font-medium text-leather-800">Notes</label>
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
					d="M12 3c-4 4-7 7.5-7 11a7 7 0 1014 0c0-3.5-3-7-7-11z"
				/>
			</svg>
			<p class="mt-3 text-sm text-amber-700">No carrier oils in your inventory yet</p>
			<button onclick={() => (showForm = true)} class="btn-vintage mt-4 text-sm">
				Add your first oil
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.oils as oil (oil.id)}
				<div class="card-glass rounded-xl p-4">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="font-display text-lg font-semibold text-leather-900">{oil.name}</h3>
							<div class="mt-1 flex flex-wrap gap-2 text-xs">
								{#if oil.absorption}
									<span class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
										{oil.absorption} absorption
									</span>
								{/if}
								{#if oil.texture}
									<span class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
										{oil.texture} texture
									</span>
								{/if}
								{#if oil.comedogenic !== null}
									<span class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
										comedogenic: {oil.comedogenic}
									</span>
								{/if}
							</div>
						</div>
						<div class="flex gap-1">
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

					{#if oil.vitamins}
						<p class="mt-2 text-xs text-amber-600">
							<span class="font-medium">Vitamins:</span>
							{oil.vitamins}
						</p>
					{/if}

					{#if oil.notes}
						<p class="mt-2 text-sm text-leather-700">{oil.notes}</p>
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
