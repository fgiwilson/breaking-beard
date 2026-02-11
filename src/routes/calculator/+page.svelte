<script lang="ts">
	let batchSize = $state(30);

	let oils = $state<Array<{ name: string; drops: number }>>([{ name: '', drops: 1 }]);

	// Per-oil percentages
	let oilPercentages = $derived(
		oils.map((oil) => ({
			...oil,
			percentage: batchSize > 0 ? ((oil.drops * 0.05) / batchSize) * 100 : 0
		}))
	);

	// Totals
	let totalDrops = $derived(oils.reduce((sum, o) => sum + o.drops, 0));
	let totalEoVolumeMl = $derived(totalDrops * 0.05);
	let totalDilutionPct = $derived(batchSize > 0 ? (totalEoVolumeMl / batchSize) * 100 : 0);
	let carrierVolumeMl = $derived(Math.max(0, batchSize - totalEoVolumeMl));

	// Safety level
	let safetyLevel = $derived.by(() => {
		if (totalDilutionPct <= 2) return 'safe';
		if (totalDilutionPct <= 3) return 'caution';
		return 'danger';
	});

	let safetyLabel = $derived(
		safetyLevel === 'safe'
			? 'Safe for face'
			: safetyLevel === 'caution'
				? 'Use caution'
				: 'Too concentrated'
	);

	function addOil() {
		oils.push({ name: '', drops: 1 });
	}

	function removeOil(index: number) {
		oils.splice(index, 1);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="font-display text-2xl font-bold tracking-wide text-parchment-200 lg:text-3xl">
			Dilution Calculator
		</h1>
		<p class="mt-1 font-display text-sm text-parchment-600 italic">
			Calculate essential oil drops for a target dilution. 1-2% is recommended for facial
			application.
		</p>
	</div>

	<div class="v-card p-4 lg:p-6">
		<!-- Batch size -->
		<div class="mb-6">
			<label for="batchSize" class="mb-1 block text-sm font-medium text-parchment-400">
				Batch size (ml)
			</label>
			<input type="number" id="batchSize" bind:value={batchSize} min="1" max="500" class="w-32" />
		</div>

		<!-- Oil rows -->
		<div class="mb-2 flex items-center justify-between">
			<h2 class="font-display text-lg font-semibold text-parchment-200">Essential Oils</h2>
			<button type="button" onclick={addOil} class="btn-vintage text-sm"> + Add Oil </button>
		</div>

		<div class="space-y-3">
			{#each oils as oil, i (i)}
				<div class="flex items-center gap-3 rounded-lg bg-ink-600 p-3">
					<input type="text" bind:value={oil.name} placeholder="Oil name" class="min-w-0 flex-1" />
					<input type="number" bind:value={oil.drops} min="0" max="100" class="w-20 text-center" />
					<span class="text-sm text-parchment-600">drops</span>
					<span class="w-16 text-right text-sm font-medium text-parchment-400">
						{oilPercentages[i].percentage.toFixed(2)}%
					</span>
					{#if oils.length > 1}
						<button
							type="button"
							onclick={() => removeOil(i)}
							class="text-red-400/60 transition hover:text-red-400"
							aria-label="Remove oil"
						>
							<i class="fa-sharp fa-solid fa-xmark"></i>
						</button>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Divider -->
		<div class="divider-vintage my-6 text-sm">Results</div>

		<!-- Results -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="scoop-sm bg-ink-600 p-3 text-center">
				<p class="text-xs font-medium text-parchment-600 uppercase">Total Drops</p>
				<p class="mt-1 font-display text-2xl font-bold text-amber-400">{totalDrops}</p>
			</div>

			<div class="scoop-sm bg-ink-600 p-3 text-center">
				<p class="text-xs font-medium text-parchment-600 uppercase">EO Volume</p>
				<p class="mt-1 font-display text-2xl font-bold text-amber-400">
					{totalEoVolumeMl.toFixed(2)}<span class="text-base font-normal text-parchment-500">
						ml</span
					>
				</p>
			</div>

			<div class="scoop-sm bg-ink-600 p-3 text-center">
				<p class="text-xs font-medium text-parchment-600 uppercase">Carrier Volume</p>
				<p class="mt-1 font-display text-2xl font-bold text-amber-400">
					{carrierVolumeMl.toFixed(2)}<span class="text-base font-normal text-parchment-500">
						ml</span
					>
				</p>
			</div>

			<div
				class="scoop-sm p-3 text-center {safetyLevel === 'safe'
					? 'bg-sage-500/15'
					: safetyLevel === 'caution'
						? 'bg-amber-500/15'
						: 'bg-red-500/15'}"
			>
				<p
					class="text-xs font-medium uppercase {safetyLevel === 'safe'
						? 'text-sage-300'
						: safetyLevel === 'caution'
							? 'text-amber-400'
							: 'text-red-400'}"
				>
					Dilution
				</p>
				<p
					class="mt-1 font-display text-2xl font-bold {safetyLevel === 'safe'
						? 'text-sage-300'
						: safetyLevel === 'caution'
							? 'text-amber-400'
							: 'text-red-400'}"
				>
					{totalDilutionPct.toFixed(2)}%
				</p>
				<p
					class="mt-0.5 text-xs font-medium {safetyLevel === 'safe'
						? 'text-sage-300'
						: safetyLevel === 'caution'
							? 'text-amber-400'
							: 'text-red-400'}"
				>
					{safetyLabel}
				</p>
			</div>
		</div>
	</div>
</div>
