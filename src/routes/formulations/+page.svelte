<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	function getScentBadgeClass(category: string | null): string {
		const map: Record<string, string> = {
			citrus: 'badge-citrus',
			woody: 'badge-woody',
			herbal: 'badge-herbal',
			floral: 'badge-floral',
			spicy: 'badge-spicy',
			earthy: 'badge-earthy'
		};
		return map[category?.toLowerCase() ?? ''] ?? 'bg-amber-200 text-leather-800';
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-end justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold text-leather-900">Formulas</h1>
			<p class="mt-1 text-sm text-amber-700">Your beard oil recipes</p>
		</div>
		<a href={resolve('/formulations/new')} class="btn-vintage">
			<span class="flex items-center gap-2">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				New Formula
			</span>
		</a>
	</div>

	<!-- Filters -->
	<div class="flex gap-2">
		<a
			href={resolve('/formulations')}
			class="rounded-full px-3 py-1.5 text-sm font-medium transition"
			class:bg-amber-500={!data.filter}
			class:text-white={!data.filter}
			class:bg-amber-100={data.filter}
			class:text-amber-700={data.filter}
		>
			All
		</a>
		<!-- eslint-disable svelte/no-navigation-without-resolve -- path is resolved, query param appended -->
		{#each ['morning', 'evening', 'all-day'] as purpose (purpose)}
			<a
				href={`${resolve('/formulations')}?purpose=${purpose}`}
				class="rounded-full px-3 py-1.5 text-sm font-medium capitalize transition"
				class:bg-amber-500={data.filter === purpose}
				class:text-white={data.filter === purpose}
				class:bg-amber-100={data.filter !== purpose}
				class:text-amber-700={data.filter !== purpose}
			>
				{purpose}
			</a>
		{/each}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>

	<!-- Formulas Grid -->
	{#if data.formulations.length === 0}
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
					d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
				/>
			</svg>
			<p class="mt-3 text-sm text-amber-700">
				{data.filter ? `No ${data.filter} formulas yet` : 'No formulas yet'}
			</p>
			<a href={resolve('/formulations/new')} class="btn-vintage mt-4 inline-block text-sm">
				Create your first formula
			</a>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.formulations as formula (formula.id)}
				<a
					href={resolve(`/formulations/${formula.id}`)}
					class="card-glass rounded-xl p-4 transition hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h3 class="font-display text-lg font-semibold text-leather-900">{formula.name}</h3>
							<div class="mt-1 flex items-center gap-2 text-xs text-amber-600">
								{#if formula.purpose}
									<span class="rounded-full bg-amber-100 px-2 py-0.5 capitalize">
										{formula.purpose}
									</span>
								{/if}
								{#if formula.totalVolumeMl}
									<span>{formula.totalVolumeMl}ml</span>
								{/if}
							</div>
						</div>
						{#if formula._count.testLogs > 0}
							<span class="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
								{formula._count.testLogs} tests
							</span>
						{/if}
					</div>

					<!-- Essential oils -->
					{#if formula.essentialOils.length > 0}
						<div class="mt-3">
							<p class="text-xs font-medium text-amber-700">Essential oils:</p>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each formula.essentialOils as eo (eo.id)}
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
											eo.essentialOil.scentCategory
										)}"
									>
										{eo.essentialOil.name}
										{#if eo.drops}
											<span class="opacity-75">({eo.drops})</span>
										{/if}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Carrier oils -->
					{#if formula.carrierOils.length > 0}
						<div class="mt-2">
							<p class="text-xs font-medium text-amber-700">Base:</p>
							<p class="text-leather-600 mt-0.5 text-xs">
								{formula.carrierOils
									.map((co) => `${co.carrierOil.name} (${co.percentage}%)`)
									.join(', ')}
							</p>
						</div>
					{/if}

					{#if formula.notes}
						<p class="text-leather-600 mt-2 line-clamp-2 text-sm">{formula.notes}</p>
					{/if}

					<p class="mt-3 text-xs text-amber-500">Updated {formatDate(formula.updatedAt)}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
