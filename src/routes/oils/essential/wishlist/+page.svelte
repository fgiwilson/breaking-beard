<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps, ActionData } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let showForm = $state(false);
	let editingItem = $state<(typeof data.items)[0] | null>(null);

	const scentCategories = ['citrus', 'woody', 'herbal', 'floral', 'spicy', 'earthy', 'resinous'];

	const priorityLabels: Record<number, string> = { 0: 'Low', 1: 'Medium', 2: 'High' };
	const priorityColors: Record<number, string> = {
		0: 'text-parchment-600',
		1: 'text-amber-500',
		2: 'text-rose-400'
	};

	function startEdit(item: (typeof data.items)[0]) {
		editingItem = item;
		showForm = true;
	}

	function cancelForm() {
		showForm = false;
		editingItem = null;
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
	<!-- Header -->
	<div class="flex items-end justify-between">
		<div>
			<a
				href={resolve('/oils/essential')}
				class="font-display text-sm text-amber-600 transition hover:text-amber-400"
				>&larr; Essential Oils</a
			>
			<h1 class="mt-1 font-display text-2xl font-bold tracking-wide text-parchment-200">
				Oil Wishlist
			</h1>
			<p class="mt-1 font-display text-sm text-parchment-600 italic">Oils to acquire</p>
		</div>
		<button onclick={() => (showForm = true)} class="btn-vintage">
			<span class="flex items-center gap-2">
				<i class="fa-sharp fa-solid fa-plus"></i>
				Add to Wishlist
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
					{editingItem ? 'Edit' : 'Add'} Wishlist Oil
				</h2>

				{#if form?.error}
					<div class="scoop-sm mb-4 bg-red-500/15 p-3 text-sm text-red-400">
						{form.error}
					</div>
				{/if}

				<form
					method="POST"
					action={editingItem ? '?/update' : '?/create'}
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
					{#if editingItem}
						<input type="hidden" name="id" value={editingItem.id} />
					{/if}

					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-parchment-400">Name</label>
						<input
							type="text"
							id="name"
							name="name"
							value={editingItem?.name ?? ''}
							required
							class="w-full"
							placeholder="e.g., Ylang Ylang"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="scentCategory" class="mb-1 block text-sm font-medium text-parchment-400">
								Scent Category
							</label>
							<select id="scentCategory" name="scentCategory" class="w-full">
								<option value="">Select...</option>
								{#each scentCategories as cat (cat)}
									<option value={cat} selected={editingItem?.scentCategory === cat}>
										{cat.charAt(0).toUpperCase() + cat.slice(1)}
									</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="priority" class="mb-1 block text-sm font-medium text-parchment-400">
								Priority
							</label>
							<select id="priority" name="priority" class="w-full">
								<option value="0" selected={editingItem?.priority === 0}>Low</option>
								<option value="1" selected={editingItem?.priority === 1}>Medium</option>
								<option value="2" selected={editingItem?.priority === 2}>High</option>
							</select>
						</div>
					</div>

					<div>
						<label for="purchaseUrl" class="mb-1 block text-sm font-medium text-parchment-400">
							Purchase URL
						</label>
						<input
							type="url"
							id="purchaseUrl"
							name="purchaseUrl"
							value={editingItem?.purchaseUrl ?? ''}
							class="w-full"
							placeholder="https://..."
						/>
					</div>

					<div>
						<label for="notes" class="mb-1 block text-sm font-medium text-parchment-400">
							Notes
						</label>
						<textarea
							id="notes"
							name="notes"
							rows="3"
							class="w-full"
							placeholder="Why you want this oil, blend ideas, etc."
							>{editingItem?.notes ?? ''}</textarea
						>
					</div>

					<div class="flex gap-3">
						<button type="submit" class="btn-vintage flex-1">
							{editingItem ? 'Update' : 'Add'}
						</button>
						<button type="button" onclick={cancelForm} class="btn-outline flex-1"> Cancel </button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- List -->
	{#if data.items.length === 0}
		<div class="v-card p-8 text-center">
			<i class="fa-duotone fa-solid fa-star text-4xl text-ink-500"></i>
			<p class="mt-3 text-sm text-parchment-600">Your wishlist is empty</p>
			<button onclick={() => (showForm = true)} class="btn-vintage mt-4 text-sm">
				Add your first oil
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.items as item (item.id)}
				<div class="v-card p-4 transition" class:opacity-50={item.purchased}>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h3
								class="font-display text-lg font-semibold text-parchment-200"
								class:line-through={item.purchased}
								class:text-parchment-500={item.purchased}
							>
								{item.name}
							</h3>
							<div class="mt-1 flex flex-wrap items-center gap-2">
								{#if item.scentCategory}
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
											item.scentCategory
										)}"
									>
										{item.scentCategory}
									</span>
								{/if}
								<span class="text-xs font-medium {priorityColors[item.priority]}">
									{priorityLabels[item.priority]} priority
								</span>
							</div>
						</div>
						<div class="flex gap-1">
							<form method="POST" action="?/togglePurchased" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<button
									type="submit"
									class="scoop-sm p-1.5 transition {item.purchased
										? 'text-sage-300 hover:bg-ink-500'
										: 'text-parchment-600 hover:bg-ink-500 hover:text-sage-300'}"
									aria-label={item.purchased ? 'Mark as not purchased' : 'Mark as purchased'}
									title={item.purchased ? 'Undo purchase' : 'Mark purchased'}
								>
									<i
										class="fa-sharp {item.purchased
											? 'fa-solid fa-circle-check'
											: 'fa-regular fa-circle'}"
									></i>
								</button>
							</form>
							<button
								onclick={() => startEdit(item)}
								class="scoop-sm p-1.5 text-parchment-600 transition hover:bg-ink-500 hover:text-amber-400"
								aria-label="Edit {item.name}"
							>
								<i class="fa-sharp fa-regular fa-pen-to-square"></i>
							</button>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<button
									type="submit"
									class="scoop-sm p-1.5 text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400"
									aria-label="Delete {item.name}"
								>
									<i class="fa-sharp fa-regular fa-trash-can"></i>
								</button>
							</form>
						</div>
					</div>

					{#if item.purchaseUrl}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external URL -->
						<a
							href={item.purchaseUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 transition hover:text-amber-400"
							onclick={(e) => e.stopPropagation()}
						>
							<i class="fa-sharp fa-regular fa-arrow-up-right-from-square text-[0.6rem]"></i>
							Purchase link
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}

					{#if item.notes}
						<p class="mt-2 text-sm text-parchment-500">{item.notes}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
