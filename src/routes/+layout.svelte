<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	let sidebarOpen = $state(false);

	const navItems = [
		{
			title: 'Dashboard',
			href: '/' as const,
			icon: 'home'
		},
		{
			title: 'Inventory',
			items: [
				{ title: 'Carrier Oils', href: '/oils/carrier' as const, icon: 'droplet' },
				{ title: 'Essential Oils', href: '/oils/essential' as const, icon: 'flask' }
			]
		},
		{
			title: 'Formulas',
			items: [
				{ title: 'All Formulas', href: '/formulations' as const, icon: 'beaker' },
				{ title: 'New Formula', href: '/formulations/new' as const, icon: 'plus' }
			]
		},
		{
			title: 'Journal',
			href: '/diary' as const,
			icon: 'book'
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
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<title>Breaking Beard - Oil Formulation Tracker</title>
</svelte:head>

<div class="flex min-h-screen">
	<!-- Mobile header -->
	<header
		class="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-amber-200 bg-cream-50/95 px-4 backdrop-blur-sm lg:hidden"
	>
		<button
			onclick={() => (sidebarOpen = !sidebarOpen)}
			class="flex h-10 w-10 items-center justify-center rounded-lg text-leather-800 transition hover:bg-amber-100"
			aria-label="Toggle menu"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if sidebarOpen}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				{:else}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				{/if}
			</svg>
		</button>
		<div class="flex items-center gap-2">
			<svg class="h-7 w-7 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M12 2C10.34 2 9 3.34 9 5v1.07c-1.79.47-3.2 1.93-3.73 3.78L4 14v2h16v-2l-1.27-4.15C18.2 8 16.79 6.54 15 6.07V5c0-1.66-1.34-3-3-3zm-1 3c0-.55.45-1 1-1s1 .45 1 1v.77c-.32-.05-.66-.07-1-.07s-.68.02-1 .07V5zM6.5 18C6.5 19.93 8.07 21.5 10 21.5c1.3 0 2-.5 2-.5s.7.5 2 .5c1.93 0 3.5-1.57 3.5-3.5h-11z"
				/>
			</svg>
			<span class="font-display text-lg font-semibold text-leather-900">Breaking Beard</span>
		</div>
		<div class="w-10"></div>
	</header>

	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-40 bg-leather-900/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Close menu"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-amber-200 bg-cream-50 transition-transform duration-300 lg:translate-x-0"
		class:translate-x-0={sidebarOpen}
		class:-translate-x-full={!sidebarOpen}
	>
		<!-- Logo -->
		<div class="flex h-16 items-center gap-3 border-b border-amber-200 px-4">
			<svg class="h-9 w-9 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M12 2C10.34 2 9 3.34 9 5v1.07c-1.79.47-3.2 1.93-3.73 3.78L4 14v2h16v-2l-1.27-4.15C18.2 8 16.79 6.54 15 6.07V5c0-1.66-1.34-3-3-3zm-1 3c0-.55.45-1 1-1s1 .45 1 1v.77c-.32-.05-.66-.07-1-.07s-.68.02-1 .07V5zM6.5 18C6.5 19.93 8.07 21.5 10 21.5c1.3 0 2-.5 2-.5s.7.5 2 .5c1.93 0 3.5-1.57 3.5-3.5h-11z"
				/>
			</svg>
			<div>
				<h1 class="font-display text-xl leading-tight font-bold text-leather-900">
					Breaking Beard
				</h1>
				<p class="text-xs text-amber-700">Oil Formulation Lab</p>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto p-3">
			{#each navItems as item (item.title)}
				{#if item.href}
					<a
						href={resolve(item.href)}
						onclick={() => (sidebarOpen = false)}
						class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
						class:bg-amber-100={isActive(item.href)}
						class:text-amber-800={isActive(item.href)}
						class:text-leather-700={!isActive(item.href)}
						class:hover:bg-amber-50={!isActive(item.href)}
					>
						{#if item.icon === 'home'}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
						{:else if item.icon === 'book'}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
								/>
							</svg>
						{/if}
						{item.title}
					</a>
				{:else if item.items}
					<div class="mb-1">
						<div class="px-3 py-2 text-xs font-semibold tracking-wide text-amber-600 uppercase">
							{item.title}
						</div>
						{#each item.items as subItem (subItem.href)}
							<a
								href={resolve(subItem.href)}
								onclick={() => (sidebarOpen = false)}
								class="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
								class:bg-amber-100={isActive(subItem.href)}
								class:text-amber-800={isActive(subItem.href)}
								class:text-leather-700={!isActive(subItem.href)}
								class:hover:bg-amber-50={!isActive(subItem.href)}
							>
								{#if subItem.icon === 'droplet'}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 3c-4 4-7 7.5-7 11a7 7 0 1014 0c0-3.5-3-7-7-11z"
										/>
									</svg>
								{:else if subItem.icon === 'flask'}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 3v2m6-2v2M9 5h6m-7 4l-2 10h12l-2-10M8 9h8"
										/>
									</svg>
								{:else if subItem.icon === 'beaker'}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
										/>
									</svg>
								{:else if subItem.icon === 'plus'}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
								{/if}
								{subItem.title}
							</a>
						{/each}
					</div>
				{/if}
			{/each}
		</nav>

		<!-- Footer -->
		<div class="border-t border-amber-200 p-4">
			<div class="flex items-center gap-2 text-xs text-amber-700">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
				<span>Crafted with care</span>
			</div>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 pt-14 lg:ml-64 lg:pt-0">
		<div class="mx-auto max-w-5xl p-4 lg:p-6">
			{@render children()}
		</div>
	</main>
</div>
