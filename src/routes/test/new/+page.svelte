<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data, form }: PageProps = $props();

	let selectedFormulation = $state('');
	let testNotes = $state('');
	let testRating = $state<number | null>(null);

	$effect(() => {
		if (data.preselected) {
			selectedFormulation = data.preselected;
		}
	});
</script>

<div class="mx-auto max-w-xl space-y-6">
	<!-- Header -->
	<div>
		<a
			href={resolve('/')}
			class="font-display text-sm text-amber-600 transition hover:text-amber-400"
		>
			&larr; Dashboard
		</a>
		<h1 class="mt-1 font-display text-2xl font-bold tracking-wide text-parchment-200">
			Log a Test
		</h1>
		<p class="mt-1 font-display text-sm text-parchment-600 italic">
			Record your experience with a formulation
		</p>
	</div>

	<!-- Form -->
	<form
		method="POST"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					testNotes = '';
					testRating = null;
				}
				await update();
			};
		}}
		class="v-card space-y-5 p-6"
	>
		{#if form?.error}
			<div class="scoop-sm bg-red-500/10 px-4 py-2 text-sm text-red-400">
				{form.error}
			</div>
		{/if}

		<!-- Formulation select -->
		<div>
			<label for="formulationId" class="mb-1.5 block text-sm font-medium text-parchment-400">
				Formulation
			</label>
			{#if data.formulations.length === 0}
				<p class="text-sm text-parchment-600">
					No formulations yet.
					<a
						href={resolve('/formulations/new')}
						class="text-amber-500 transition hover:text-amber-400">Create one first</a
					>.
				</p>
			{:else}
				<select
					id="formulationId"
					name="formulationId"
					bind:value={selectedFormulation}
					required
					class="w-full"
				>
					<option value="" disabled>Choose a formula...</option>
					{#each data.formulations as f (f.id)}
						<option value={f.id}>
							{f.name}{f.purpose ? ` (${f.purpose})` : ''}
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Notes -->
		<div>
			<label for="testNotes" class="mb-1.5 block text-sm font-medium text-parchment-400">
				How did it go?
			</label>
			<textarea
				id="testNotes"
				name="notes"
				bind:value={testNotes}
				required
				rows="4"
				class="w-full"
				placeholder="Describe the scent, feel, longevity..."
			></textarea>
		</div>

		<!-- Rating -->
		<div>
			<span id="rating-label" class="mb-2 block text-sm font-medium text-parchment-400">
				Rating
			</span>
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

		<!-- Submit -->
		<button type="submit" class="btn-vintage w-full" disabled={data.formulations.length === 0}>
			<span class="flex items-center justify-center gap-2">
				<i class="fa-duotone fa-solid fa-clipboard-list"></i>
				Save Test Log
			</span>
		</button>
	</form>
</div>
