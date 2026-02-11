<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	const statuses = [
		{ value: 'not-tested', label: 'Not Tested' },
		{ value: 'cottonball', label: 'Cottonball' },
		{ value: 'carrier', label: 'Carrier' },
		{ value: 'final', label: 'Final' }
	];

	function getScentBadgeClass(category: string | null): string {
		const map: Record<string, string> = {
			citrus: 'badge-citrus',
			woody: 'badge-woody',
			herbal: 'badge-herbal',
			floral: 'badge-floral',
			spicy: 'badge-spicy',
			earthy: 'badge-earthy'
		};
		return map[category?.toLowerCase() ?? ''] ?? 'bg-ink-500 text-parchment-400';
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

	function filterHref(key: 'purpose' | 'status' | 'melissaApproved', value: string | null): string {
		const purpose = key === 'purpose' ? value : data.filter;
		const status = key === 'status' ? value : data.statusFilter;
		const melissa = key === 'melissaApproved' ? value === 'true' : data.melissaFilter;

		const parts: string[] = [];
		if (purpose) parts.push(`purpose=${encodeURIComponent(purpose)}`);
		if (status) parts.push(`status=${encodeURIComponent(status)}`);
		if (melissa) parts.push('melissaApproved=true');

		const qs = parts.join('&');
		return resolve(`/formulations${qs ? `?${qs}` : ''}`);
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
			<h1 class="font-display text-2xl font-bold tracking-wide text-parchment-200">
				The Formulary
			</h1>
			<p class="mt-1 font-display text-sm text-parchment-600 italic">Your beard oil recipes</p>
		</div>
		<a href={resolve('/formulations/new')} class="btn-vintage">
			<span class="flex items-center gap-2">
				<i class="fa-duotone fa-solid fa-feather-pointed"></i>
				New Formula
			</span>
		</a>
	</div>

	<!-- Filters -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -- filterHref() uses resolve() internally -->
	<div class="space-y-2">
		<!-- Purpose row -->
		<div class="flex flex-wrap gap-2">
			<a
				href={filterHref('purpose', null)}
				class="scoop-sm px-4 py-1.5 text-sm font-medium transition"
				class:bg-amber-600={!data.filter}
				class:text-parchment-100={!data.filter}
				class:bg-ink-600={data.filter}
				class:text-parchment-500={data.filter}
			>
				All
			</a>
			{#each ['morning', 'evening', 'all-day'] as purpose (purpose)}
				<a
					href={filterHref('purpose', purpose)}
					class="scoop-sm px-4 py-1.5 text-sm font-medium capitalize transition"
					class:bg-amber-600={data.filter === purpose}
					class:text-parchment-100={data.filter === purpose}
					class:bg-ink-600={data.filter !== purpose}
					class:text-parchment-500={data.filter !== purpose}
				>
					{purpose}
				</a>
			{/each}
		</div>

		<!-- Status row -->
		<div class="flex flex-wrap gap-2">
			<a
				href={filterHref('status', null)}
				class="scoop-sm px-3 py-1 text-xs font-medium transition"
				class:bg-amber-600={!data.statusFilter}
				class:text-parchment-100={!data.statusFilter}
				class:bg-ink-600={data.statusFilter}
				class:text-parchment-500={data.statusFilter}
			>
				Any Status
			</a>
			{#each statuses as s (s.value)}
				<a
					href={filterHref('status', s.value)}
					class="scoop-sm px-3 py-1 text-xs font-medium transition"
					class:bg-amber-600={data.statusFilter === s.value}
					class:text-parchment-100={data.statusFilter === s.value}
					class:bg-ink-600={data.statusFilter !== s.value}
					class:text-parchment-500={data.statusFilter !== s.value}
				>
					{s.label}
				</a>
			{/each}

			<span class="mx-1 self-center text-ink-500">|</span>

			<a
				href={filterHref('melissaApproved', data.melissaFilter ? null : 'true')}
				class="scoop-sm flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition {data.melissaFilter
					? 'bg-rose-500/20 text-rose-400'
					: 'bg-ink-600 text-parchment-500'}"
			>
				<i class="fa-{data.melissaFilter ? 'solid' : 'regular'} fa-heart text-[0.65rem]"></i>
				Melissa Approved
			</a>
		</div>
	</div>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->

	<!-- Formulas Grid -->
	{#if data.formulations.length === 0}
		<div class="v-card p-8 text-center">
			<i class="fa-duotone fa-solid fa-flask-vial text-4xl text-ink-500"></i>
			<p class="mt-3 text-sm text-parchment-600">
				{data.filter ? `No ${data.filter} formulas yet` : 'No formulas yet'}
			</p>
			<a href={resolve('/formulations/new')} class="btn-vintage mt-4 inline-block text-sm">
				Create your first formula
			</a>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.formulations as formula (formula.id)}
				<a href={resolve(`/formulations/${formula.id}`)} class="v-card p-5 transition">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<h3 class="font-display text-lg font-semibold text-parchment-200">
									{formula.name}
								</h3>
								{#if formula.melissaApproved}
									<i class="fa-solid fa-heart text-[0.65rem] text-rose-400" title="Melissa Approved"
									></i>
								{/if}
							</div>
							<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-parchment-600">
								{#if formula.purpose}
									<span
										class="scoop-xs border border-amber-500/15 bg-ink-600 px-2 py-0.5 capitalize"
									>
										{formula.purpose}
									</span>
								{/if}
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusBadgeClass(
										formula.status
									)}"
								>
									{getStatusLabel(formula.status)}
								</span>
								{#if formula.totalVolumeMl}
									<span>{formula.totalVolumeMl}ml</span>
								{/if}
							</div>
						</div>
						{#if formula._count.testLogs > 0}
							<span class="scoop-xs bg-amber-600/20 px-2 py-0.5 text-xs font-medium text-amber-400">
								{formula._count.testLogs} tests
							</span>
						{/if}
					</div>

					<!-- Essential oils -->
					{#if formula.essentialOils.length > 0}
						<div class="mt-3">
							<p class="text-[0.65rem] font-semibold tracking-wider text-parchment-700 uppercase">
								Essential oils
							</p>
							<div class="mt-1 flex flex-wrap gap-1">
								{#each formula.essentialOils as eo (eo.id)}
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {getScentBadgeClass(
											eo.essentialOil.scentCategory
										)}"
									>
										{eo.essentialOil.name}
										{#if eo.drops}
											<span class="opacity-70">({eo.drops})</span>
										{/if}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Carrier oils -->
					{#if formula.carrierOils.length > 0}
						<div class="mt-2">
							<p class="text-[0.65rem] font-semibold tracking-wider text-parchment-700 uppercase">
								Base
							</p>
							<p class="mt-0.5 text-xs text-parchment-500">
								{formula.carrierOils
									.map((co) => `${co.carrierOil.name} (${co.percentage}%)`)
									.join(', ')}
							</p>
						</div>
					{/if}

					{#if formula.notes}
						<p class="mt-2 line-clamp-2 text-sm text-parchment-500">{formula.notes}</p>
					{/if}

					<p class="mt-3 text-xs text-parchment-700">Updated {formatDate(formula.updatedAt)}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
