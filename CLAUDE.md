You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

# Beard Oil Formulation Tracker

A personal SvelteKit application for tracking DIY beard oil development, including carrier oils, essential oils, formulations, and test logs. Features an AI assistant powered by Claude Haiku for contextual recommendations.

## Project Context

This app is built for a methodical approach to beard oil formulation development. The user:

- Creates formulations with specific time-of-day applications (morning energizing vs evening calming)
- Tracks each formula through a testing pipeline: Not Tested → Cottonball → Carrier Oil → Final
- Tracks Melissa's approval on formulations (partner sign-off)
- Maintains an essential oil wishlist for oils to purchase
- Prefers understated, approachable scents over heavily masculine woody fragrances
- Favors bergamot-forward citrus blends
- Follows the principle that simpler formulas (3-4 oils max) work better than complex blends
- Uses 1-2% essential oil concentration for safe facial application
- Tests formulations in 1-ounce batches using inexpensive carrier oils

Current formulation work includes:

- **Morning blend (refined citrus-woody)**: bergamot, cypress, black pepper
- **Morning blend (clean air fresh)**: lavender, bergamot, eucalyptus
- **Evening blend (grounding)**: cedarwood, lavender, frankincense (exploring cedarwood alternatives)

Current oil inventory:

- **Carriers**: jojoba, sweet almond, argan
- **Essential oils**: eucalyptus, bergamot, lemongrass, cypress, lavender, spearmint, frankincense, cedarwood, grapefruit

## Tech Stack

| Layer      | Technology                      | Notes                                                                   |
| ---------- | ------------------------------- | ----------------------------------------------------------------------- |
| Framework  | SvelteKit + Svelte 5            | Full-stack, TypeScript, runes ($state, $props, $derived, $effect)       |
| ORM        | Prisma 7                        | Driver adapters, better-sqlite3                                         |
| Database   | SQLite                          | File-based at project root (dev.db)                                     |
| Styling    | Tailwind CSS v4                 | @theme directive, oklch colors, custom beardsman theme                  |
| Icons      | FontAwesome Kit (Duotone/Sharp) | Loaded via kit script tag in app.html; use `fa-duotone fa-solid` prefix |
| Testing    | Vitest                          | In-memory SQLite via test-helpers.ts                                    |
| AI         | Anthropic API (Claude Haiku)    | Cost-effective for simple queries                                       |
| Deployment | Coolify                         | Self-hosted, persistent volume for SQLite already configured            |

## Database Schema

```prisma
model CarrierOil {
  id          String   @id @default(cuid())
  name        String   @unique
  comedogenic Int?     // 0-5 scale
  absorption  String?  // fast, medium, slow
  vitamins    String?  // e.g., "A, E"
  texture     String?  // light, medium, heavy
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  formulations FormulationCarrierOil[]
}

model EssentialOil {
  id            String   @id @default(cuid())
  name          String   @unique
  scentCategory String?  // citrus, woody, floral, herbal, spicy, resinous, earthy
  safetyNotes   String?  // e.g., "phototoxic - avoid sun exposure"
  minDrops      Int?     // minimum drops per 30ml batch
  maxDrops      Int?     // maximum drops per 30ml batch
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  formulations FormulationEssentialOil[]
  pairings     EssentialOilPairing[]     @relation("PairingFrom")
  pairedWith   EssentialOilPairing[]     @relation("PairingTo")
}

model EssentialOilPairing {
  id        String       @id @default(cuid())
  oil1      EssentialOil @relation("PairingFrom", fields: [oil1Id], references: [id], onDelete: Cascade)
  oil1Id    String
  oil2      EssentialOil @relation("PairingTo", fields: [oil2Id], references: [id], onDelete: Cascade)
  oil2Id    String
  notes     String?
  createdAt DateTime     @default(now())

  @@unique([oil1Id, oil2Id])
}

model DiaryEntry {
  id        String   @id @default(cuid())
  title     String?
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Formulation {
  id              String   @id @default(cuid())
  name            String
  purpose         String?  // "morning", "evening", "all-day"
  status          String   @default("not-tested") // not-tested, cottonball, carrier, final
  melissaApproved Boolean  @default(false)
  totalVolumeMl   Float?   // target batch size
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  carrierOils   FormulationCarrierOil[]
  essentialOils FormulationEssentialOil[]
  testLogs      TestLog[]
}

model FormulationCarrierOil {
  id            String      @id @default(cuid())
  formulation   Formulation @relation(fields: [formulationId], references: [id], onDelete: Cascade)
  formulationId String
  carrierOil    CarrierOil  @relation(fields: [carrierOilId], references: [id])
  carrierOilId  String
  percentage    Float       // percentage of carrier base

  @@unique([formulationId, carrierOilId])
}

model FormulationEssentialOil {
  id             String       @id @default(cuid())
  formulation    Formulation  @relation(fields: [formulationId], references: [id], onDelete: Cascade)
  formulationId  String
  essentialOil   EssentialOil @relation(fields: [essentialOilId], references: [id])
  essentialOilId String
  drops          Int?         // number of drops
  percentage     Float?       // calculated percentage of total

  @@unique([formulationId, essentialOilId])
}

model TestLog {
  id            String      @id @default(cuid())
  formulation   Formulation @relation(fields: [formulationId], references: [id], onDelete: Cascade)
  formulationId String
  date          DateTime    @default(now())
  notes         String
  rating        Int?        // 1-5 scale
  createdAt     DateTime    @default(now())

  @@index([formulationId, date])
}

model EssentialOilWishlist {
  id            String   @id @default(cuid())
  name          String   @unique
  scentCategory String?  // citrus, woody, floral, herbal, etc.
  notes         String?
  priority      Int      @default(0) // 0=low, 1=medium, 2=high
  purchaseUrl   String?
  purchased     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Route Structure

```
src/routes/
├── +page.svelte                    # Dashboard: stats, recent formulas, test logs, quick diary
├── +page.server.ts                 # Dashboard data loading
├── +layout.svelte                  # App shell with mobile-responsive sidebar navigation
├── layout.css                      # Custom beardsman theme (Tailwind v4 @theme)
│
├── formulations/
│   ├── +page.svelte                # List all formulations (filterable by purpose, status, melissaApproved)
│   ├── +page.server.ts             # Composite filtering via query params
│   ├── new/
│   │   ├── +page.svelte            # Create formulation with oil selection
│   │   └── +page.server.ts
│   └── [id]/
│       ├── +page.svelte            # View/edit formulation + test logs + oils + status + melissa toggle
│       └── +page.server.ts         # Actions: update, addTestLog, deleteTestLog, updateOils, delete, toggleMelissaApproved
│
├── oils/
│   ├── carrier/
│   │   ├── +page.svelte            # Carrier oil catalog with inline add/edit
│   │   └── +page.server.ts
│   └── essential/
│       ├── +page.svelte            # Essential oil catalog with pairing management
│       ├── +page.server.ts
│       └── wishlist/
│           ├── +page.svelte        # Essential oil wishlist (purchase tracking)
│           └── +page.server.ts     # Actions: create, update, togglePurchased, delete
│
├── test/
│   └── new/
│       ├── +page.svelte            # Global quick-add test log (select formulation + notes + rating)
│       └── +page.server.ts         # Load formulations, create test log, redirect to formulation
│
├── diary/
│   ├── +page.svelte                # Journal entries list with add form
│   └── +page.server.ts
│
├── calculator/
│   └── +page.svelte                # Standalone dilution calculator (client-side only)
│
├── assistant/                      # (Not yet implemented)
│   └── +page.svelte
│
└── api/
    ├── formulations/
    │   └── +server.ts              # POST: create formulation (accepts optional status field)
    └── diary/
        └── +server.ts              # POST: create diary entry
```

## AI Assistant

### Authentication

Uses Anthropic API with a separate API key (stored in `.env` as `ANTHROPIC_API_KEY`). Claude Pro/Max subscriptions do not extend to custom applications.

### Model

Claude Haiku (`claude-haiku-4-5-20251001`) for cost efficiency. Expected usage is light (occasional queries), so costs should be minimal.

### Capabilities

The assistant has read access to all data via tools and can draft entries for user approval:

| Tool                 | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `searchFormulations` | Query formulations by name, purpose, or ingredients |
| `getFormulation`     | Retrieve full formulation details with test logs    |
| `searchOils`         | Search carrier or essential oils                    |
| `getTestLogs`        | Get test history for a formulation                  |
| `calculateDilution`  | Compute drops/percentages for a batch size          |
| `draftFormulation`   | Create a formulation draft for review               |
| `draftTestLog`       | Create a test log draft for review                  |

### System Prompt Context

The assistant is primed with:

1. **Domain knowledge**: Safe dilution rates (1-2% for face), phototoxicity concerns (bergamot, other citrus), scent family pairings, carrier oil properties
2. **User preferences**: Bergamot-forward, understated rather than heavily woody, 3-4 oils max, distinct morning vs evening profiles
3. **Learned principles**: Simpler formulas work better, low-percentage ingredients may not contribute meaningfully

### UI Integration

- **Dedicated chat**: `/assistant` route with full conversation interface
- **Contextual triggers**: "Ask AI" buttons on formulation details, low-rated test logs, oil details
- **Mobile-friendly**: Floating action button for quick queries

## Development Phases

### Phase 1: Foundation ✓

- [x] Initialize SvelteKit project with TypeScript
- [x] Set up Prisma 7 with SQLite (driver adapters + better-sqlite3)
- [x] Create database schema and run migrations
- [x] Set up Tailwind CSS v4 with custom beardsman theme
- [x] Create app layout and navigation (mobile-responsive sidebar)

### Phase 2: Oil Catalogs ✓

- [x] CRUD for carrier oils
- [x] CRUD for essential oils
- [x] List views with search/filter
- [x] Detail views with edit capability
- [x] Seed data with current inventory
- [x] Essential oil pairing system (self-referential many-to-many)

### Phase 3: Formulations ✓

- [x] Create formulation with oil selection UI
- [x] Set ratios (percentages for carriers, drops for EOs)
- [x] View formulation with calculated percentages
- [x] Edit existing formulations (modal + inline oil editing)
- [x] List view filterable by purpose
- [x] Composite filtering by purpose, status, and melissa approval
- [x] Status tracking pipeline (not-tested → cottonball → carrier → final)
- [x] Melissa Approved toggle with duotone heart icon

### Phase 4: Test Logs ✓

- [x] Add test log to formulation (with 1-5 star ratings)
- [x] Quick-add from dashboard
- [x] Quick-add from global `/test/new` route (formulation selector, notes, rating, redirects to detail)
- [x] Timeline view on formulation detail
- [x] Rating display and filtering

### Phase 5: Calculator ✓

- [x] Standalone dilution calculator
- [x] Inputs: batch size, oil names, drops per oil
- [x] Outputs: carrier volume, drops per EO, dilution %, safety warnings
- [x] Basic dilution % shown on formulation detail

### Phase 5.5: Essential Oil Wishlist ✓

- [x] Standalone wishlist at `/oils/essential/wishlist`
- [x] CRUD with modal-based add/edit (same pattern as oil catalogs)
- [x] Priority levels (low/medium/high), scent category badges
- [x] Purchase URL as external link
- [x] Purchased toggle with visual dimming/strikethrough
- [x] Navigation link in sidebar under Ingredients

### Phase 6: AI Assistant

- [ ] Set up Anthropic SDK
- [ ] Create API route with tool definitions
- [ ] Build system prompt with domain knowledge
- [ ] Implement chat UI
- [ ] Add draft review flow
- [ ] Add contextual "Ask AI" buttons

### Phase 7: Polish & Deploy

- [x] Mobile responsive design (mobile-first)
- [x] PWA manifest for home screen install
- [x] Deployed to Coolify (persistent volume configured)
- [x] Environment variable configuration (.env.example)

## Commands

```bash
# Development
npm run dev                 # Start dev server at http://localhost:5173

# Database
npx prisma migrate dev      # Run migrations
npx prisma generate         # Regenerate Prisma client after schema changes
npx prisma studio           # Visual database browser
bunx tsx prisma/seed.ts     # Seed initial data (uses tsx, not bun, for native modules)

# Testing
npm test                    # Run all tests once (vitest --run)
npm run test:unit           # Run tests in watch mode

# Linting & Type Checking
npm run lint                # Prettier + ESLint
npm run check               # svelte-check (TypeScript)

# Build & Deploy
npm run build
npm run preview
```

## Environment Variables

See `.env.example` for the full list. Key variables:

```env
DATABASE_URL="file:dev.db"       # SQLite path (default: file:dev.db at project root)
ANTHROPIC_API_KEY="sk-ant-..."   # Required for AI assistant (Phase 6)
```

## File Structure

```
breaking-beard/
├── prisma/
│   ├── schema.prisma           # Database schema with all models
│   ├── prisma.config.ts        # Prisma 7 config (driver adapter settings)
│   ├── seed.ts                 # Seeds oils and pairings from inventory
│   └── migrations/
│       ├── 20260205180547_init/
│       ├── 20260209073100_rename_usage_pct_to_drops/
│       └── 20260211064801_add_status_approval_wishlist/
├── dev.db                      # SQLite database (at project root)
├── src/
│   ├── lib/
│   │   ├── components/         # (Shared components as needed)
│   │   └── server/
│   │       ├── db.ts           # Prisma client with better-sqlite3 adapter
│   │       ├── test-helpers.ts # In-memory SQLite test DB factory + seed helpers
│   │       └── generated/      # Prisma generated client
│   │           └── prisma/
│   ├── routes/
│   │   └── ... (see route structure above)
│   ├── app.css                 # Global styles, Tailwind imports
│   ├── app.d.ts
│   └── app.html                # FontAwesome kit script tag loaded here
├── static/
│   ├── manifest.json           # PWA web app manifest
│   ├── icon.svg                # App icon (SVG, scalable)
│   ├── icon-192.png            # App icon 192x192
│   └── icon-512.png            # App icon 512x512
├── .env                        # Local environment variables (gitignored)
├── .env.example                # Environment variable template (committed)
├── CLAUDE.md
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## Implementation Notes

### Prisma 7 Setup

Uses driver adapters instead of direct database connections:

```typescript
// src/lib/server/db.ts
import { PrismaClient } from './generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '$env/dynamic/private';

const dbUrl = env.DATABASE_URL ?? 'file:dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

`DATABASE_URL` is read from environment (defaults to `file:dev.db`). The global singleton pattern prevents connection exhaustion during hot reloads. Seed script uses `bunx tsx` (not `bun`) because better-sqlite3 is a native module.

### Svelte 5 Patterns

**Runes used throughout:**

- `$state()` for reactive state
- `$props()` for component props (replaces `export let`)
- `$derived()` for computed values
- `$effect()` for side effects and state synchronization

**Edit Modal Pattern:**
When editing existing data, sync state via `$effect` when entering edit mode:

```typescript
let editName = $state('');
let isEditing = $state(false);

$effect(() => {
	if (isEditing) {
		editName = data.formulation.name; // Sync from props when modal opens
	}
});
```

This avoids the stale initial value problem while keeping state mutable for form inputs.

### Custom Theme (Beardsman Aesthetic)

Defined in `src/routes/layout.css` using Tailwind v4's `@theme` directive:

- **Colors**: Amber/leather palette using oklch color space (ink-_, amber-_, copper-_, parchment-_, burgundy-_, sage-_)
- **Fonts**: Cormorant Garamond (headings via `--font-display`), Crimson Pro (body via `--font-body`)
- **Custom classes**: `.btn-vintage`, `.btn-outline`, `.v-card`, `.fab`, `.diary-entry`
- **Scooped corners**: `.scoop`, `.scoop-sm`, `.scoop-xs`, `.scoop-lg` (using `corner-shape: scoop`)
- **Scent category badges**: `.badge-citrus`, `.badge-woody`, `.badge-herbal`, `.badge-floral`, `.badge-spicy`, `.badge-earthy`, `.badge-resinous`
- **Status badges**: `.badge-status-untested` (gray), `.badge-status-cottonball` (lavender), `.badge-status-carrier` (sage), `.badge-status-final` (gold)
- **Ornamental dividers**: `.ornament-line`, `.ornament-divider`, `.divider-vintage`
- **Animations**: `cardReveal` (staggered card entrance), `fadeInDown`, `glow`, `fadeIn`

### FontAwesome Icons

Loaded via a FontAwesome Kit script in `src/app.html`. The kit includes **Duotone** and **Sharp** icon styles. Always use `fa-duotone fa-solid` prefix for filled icons (e.g., `fa-duotone fa-solid fa-flask-vial`). Do not use basic `fa-regular` or plain `fa-solid` without `fa-duotone` — it produces visually inconsistent single-tone icons.

For toggle states (like the Melissa Approved heart), keep `fa-duotone fa-solid` consistently and vary color/opacity rather than switching between icon families.

### Composite URL Filtering

The formulations list page (`/formulations`) supports multi-dimensional filtering via query params that compose together:

- `?purpose=morning` — filter by time of day
- `?status=cottonball` — filter by testing pipeline stage
- `?melissaApproved=true` — show only melissa-approved formulas
- All three combine: `?purpose=morning&status=final&melissaApproved=true`

The `filterHref()` helper function builds URLs that preserve all active filters when toggling one dimension. It uses manual string building (not `URLSearchParams`) to satisfy the `svelte/prefer-svelte-reactivity` ESLint rule.

### Server-Side Toggle Pattern

For boolean toggles like `melissaApproved`, the server action reads the current value and flips it:

```typescript
toggleMelissaApproved: async ({ params }) => {
    const formulation = await db.formulation.findUnique({
        where: { id: params.id }, select: { melissaApproved: true }
    });
    if (!formulation) return fail(404, { error: 'Formula not found' });
    await db.formulation.update({
        where: { id: params.id },
        data: { melissaApproved: !formulation.melissaApproved }
    });
    return { success: true };
},
```

This avoids relying on client-side state for the toggle value.

### Testing Infrastructure

Tests use in-memory SQLite databases for isolation. The test helper (`src/lib/server/test-helpers.ts`) contains:

- `MIGRATION_SQL`: Inline SQL string that creates all tables — **must be manually updated when the schema changes** (this is not auto-synced with Prisma migrations)
- `createTestDb()`: Factory function returning a fresh Prisma client backed by in-memory SQLite
- Seed helpers: `seedCarrierOil()`, `seedEssentialOil()`, `seedFormulation()`, `seedWishlistItem()`, etc.

Test files live alongside their routes as `*.spec.ts` files (e.g., `page.server.spec.ts`).

### ESLint Notes

- `svelte/no-navigation-without-resolve`: Filter links use `filterHref()` which calls `resolve()` internally, but ESLint can't verify this statically. Suppressed with `<!-- eslint-disable -->` blocks matching the existing codebase pattern.
- `svelte/prefer-svelte-reactivity`: Avoid using `new URLSearchParams()` inside reactive contexts — use manual string building instead.
- External links (like purchase URLs in wishlist) also need eslint-disable blocks for the navigation-without-resolve rule.

### Aesthetic Principles

- You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
  **Backgrounds**: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

#### Avoid generic AI-generated aesthetics:

- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!

### Svelte Quirks

- **`class:` directive does not support `/` in class names**: Tailwind opacity syntax like `class:bg-rose-500/20={condition}` causes a Svelte parse error. Use ternary expressions in the `class` attribute string instead: `class="... {condition ? 'bg-rose-500/20' : 'bg-ink-600'}"`.

### Route Implementation Status

| Route                      | Status | Features                                                           |
| -------------------------- | ------ | ------------------------------------------------------------------ |
| `/` (Dashboard)            | ✓      | Stats, recent formulas, test logs, quick diary entry               |
| `/formulations`            | ✓      | List with composite filtering (purpose + status + melissaApproved) |
| `/formulations/new`        | ✓      | Create with oil selection                                          |
| `/formulations/[id]`       | ✓      | View/edit, oil management, test logs, status edit, melissa toggle  |
| `/oils/carrier`            | ✓      | List, add, edit                                                    |
| `/oils/essential`          | ✓      | List with pairing management                                       |
| `/oils/essential/wishlist` | ✓      | Wishlist CRUD, priority, purchase tracking                         |
| `/test/new`                | ✓      | Global quick-add test log with formulation selector                |
| `/diary`                   | ✓      | Journal entries                                                    |
| `/calculator`              | ✓      | Batch size, oil drops, dilution %, safety indicator                |
| `/assistant`               | ○      | Not yet implemented                                                |
