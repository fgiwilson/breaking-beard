<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	let sidebarOpen = $state(false);

	const navSections = [
		{
			title: 'Workshop',
			items: [
				{ title: 'Dashboard', href: '/' as const, icon: 'fa-duotone fa-solid fa-compass' },
				{
					title: 'Formulary',
					href: '/formulations' as const,
					icon: 'fa-duotone fa-solid fa-scroll'
				},
				{
					title: 'New Formula',
					href: '/formulations/new' as const,
					icon: 'fa-duotone fa-solid fa-feather-pointed'
				}
			]
		},
		{
			title: 'Ingredients',
			items: [
				{
					title: 'Carrier Oils',
					href: '/oils/carrier' as const,
					icon: 'fa-duotone fa-solid fa-droplet'
				},
				{
					title: 'Essential Oils',
					href: '/oils/essential' as const,
					icon: 'fa-duotone fa-solid fa-flask-vial'
				}
			]
		},
		{
			title: 'Tools',
			items: [
				{
					title: 'Calculator',
					href: '/calculator' as const,
					icon: 'fa-duotone fa-solid fa-calculator'
				},
				{ title: 'Journal', href: '/diary' as const, icon: 'fa-duotone fa-solid fa-book-open' }
			]
		}
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap"
		rel="stylesheet"
	/>
	<title>Breaking Beard — Formulary & Apothecary</title>
</svelte:head>

<div class="flex min-h-screen">
	<!-- Mobile header -->
	<header
		class="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-amber-500/15 bg-ink-800/95 px-4 backdrop-blur-sm lg:hidden"
	>
		<button
			onclick={() => (sidebarOpen = !sidebarOpen)}
			class="flex h-10 w-10 items-center justify-center text-parchment-500 transition hover:text-amber-400"
			aria-label="Toggle menu"
		>
			{#if sidebarOpen}
				<i class="fa-sharp fa-solid fa-xmark text-lg"></i>
			{:else}
				<i class="fa-sharp fa-solid fa-bars text-lg"></i>
			{/if}
		</button>
		<div class="flex items-center gap-2.5">
			<i class="fa-duotone fa-solid fa-mortar-pestle text-amber-500"></i>
			<span class="font-display text-lg font-semibold tracking-wide text-parchment-200"
				>Breaking Beard</span
			>
		</div>
		<div class="w-10"></div>
	</header>

	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-40 bg-ink-950/70 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Close menu"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-amber-500/12 bg-ink-900 transition-transform duration-300 lg:translate-x-0"
		class:translate-x-0={sidebarOpen}
		class:-translate-x-full={!sidebarOpen}
	>
		<!-- Brand -->
		<div class="flex h-16 items-center gap-3 border-b border-amber-500/12 px-5">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40"
				style="animation: glow 4s ease-in-out infinite;"
			>
				<i class="fa-duotone fa-solid fa-mortar-pestle text-sm text-amber-500"></i>
			</div>
			<div>
				<h1
					class="font-display text-[1.05rem] leading-tight font-bold tracking-wider text-amber-400 uppercase"
				>
					Breaking Beard
				</h1>
				<p class="text-[0.65rem] tracking-widest text-parchment-600 uppercase">
					Formulary & Apothecary
				</p>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-4">
			{#each navSections as section, sectionIdx (section.title)}
				{#if sectionIdx > 0}
					<div class="ornament-divider">&middot; &middot; &middot;</div>
				{/if}
				<div
					class="mb-1 px-5 py-1.5 text-sm font-semibold tracking-[0.2em] text-parchment-700 uppercase"
				>
					{section.title}
				</div>
				{#each section.items as item (item.href)}
					<a
						href={resolve(item.href)}
						onclick={() => (sidebarOpen = false)}
						class="mx-2 mb-0.5 flex items-center gap-3 border-l-2 px-4 py-2 transition-all duration-200 {isActive(
							item.href
						)
							? 'border-amber-500 bg-amber-500/8 text-amber-400'
							: 'border-transparent text-parchment-500 hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400'}"
					>
						<i class="{item.icon} w-5 text-center text-[0.8rem] opacity-70"></i>
						{item.title}
					</a>
				{/each}
			{/each}
		</nav>

		<!-- Footer -->
		<div class="border-t border-amber-500/10 px-5 py-3">
			<div class="flex items-center gap-2 text-[0.7rem] tracking-wide text-parchment-700">
				<i class="fa-duotone fa-solid fa-flask text-amber-700"></i>
				<span class="italic">Crafted with care</span>
			</div>
		</div>
	</aside>

	<!-- Main content -->
	<main
		class="flex-1 pt-14 lg:ml-64 lg:pt-0"
		style="background:
			radial-gradient(ellipse at 20% 0%, oklch(0.68 0.14 70 / 0.03) 0%, transparent 60%),
			radial-gradient(ellipse at 80% 100%, oklch(0.32 0.12 15 / 0.03) 0%, transparent 60%),
			var(--color-ink-800);"
	>
		<div class="mx-auto max-w-5xl p-4 lg:p-6">
			{@render children()}
		</div>
	</main>
</div>
