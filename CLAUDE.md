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

| Layer      | Technology                   | Notes                                                             |
| ---------- | ---------------------------- | ----------------------------------------------------------------- |
| Framework  | SvelteKit + Svelte 5         | Full-stack, TypeScript, runes ($state, $props, $derived, $effect) |
| ORM        | Prisma 7                     | Driver adapters, better-sqlite3                                   |
| Database   | SQLite                       | File-based at project root (dev.db)                               |
| Styling    | Tailwind CSS v4              | @theme directive, oklch colors, custom beardsman theme            |
| AI         | Anthropic API (Claude Haiku) | Cost-effective for simple queries                                 |
| Deployment | Fly.io or Railway            | Persistent volume for SQLite                                      |

## Database Schema

```prisma
model CarrierOil {
  id            String   @id @default(cuid())
  name          String   @unique
  comedogenic   Int?     // 0-5 scale
  absorption    String?  // fast, medium, slow
  vitamins      String?  // e.g., "A, E"
  texture       String?  // light, medium, heavy
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  formulations  FormulationCarrierOil[]
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

  formulations  FormulationEssentialOil[]
  pairings1     EssentialOilPairing[] @relation("Oil1")
  pairings2     EssentialOilPairing[] @relation("Oil2")
}

model EssentialOilPairing {
  id        String       @id @default(cuid())
  oil1      EssentialOil @relation("Oil1", fields: [oil1Id], references: [id])
  oil1Id    String
  oil2      EssentialOil @relation("Oil2", fields: [oil2Id], references: [id])
  oil2Id    String
  notes     String?
  createdAt DateTime     @default(now())

  @@unique([oil1Id, oil2Id])
}

model DiaryEntry {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Formulation {
  id            String   @id @default(cuid())
  name          String
  purpose       String?  // "morning", "evening", "all-day"
  totalVolumeMl Float?   // target batch size
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

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
│   ├── +page.svelte                # List all formulations (filterable by purpose)
│   ├── +page.server.ts
│   ├── new/
│   │   ├── +page.svelte            # Create formulation with oil selection
│   │   └── +page.server.ts
│   └── [id]/
│       ├── +page.svelte            # View/edit formulation + test logs + oils
│       └── +page.server.ts         # Actions: update, addTestLog, deleteTestLog, updateOils, delete
│
├── oils/
│   ├── carrier/
│   │   ├── +page.svelte            # Carrier oil catalog with inline add/edit
│   │   └── +page.server.ts
│   └── essential/
│       ├── +page.svelte            # Essential oil catalog with pairing management
│       └── +page.server.ts
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
    │   └── +server.ts              # POST: create formulation
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

### Phase 4: Test Logs ✓

- [x] Add test log to formulation (with 1-5 star ratings)
- [x] Quick-add from dashboard
- [ ] Quick-add from global `/test/new` route
- [x] Timeline view on formulation detail
- [x] Rating display and filtering

### Phase 5: Calculator ✓

- [x] Standalone dilution calculator
- [x] Inputs: batch size, oil names, drops per oil
- [x] Outputs: carrier volume, drops per EO, dilution %, safety warnings
- [x] Basic dilution % shown on formulation detail

### Phase 6: AI Assistant

- [ ] Set up Anthropic SDK
- [ ] Create API route with tool definitions
- [ ] Build system prompt with domain knowledge
- [ ] Implement chat UI
- [ ] Add draft review flow
- [ ] Add contextual "Ask AI" buttons

### Phase 7: Polish & Deploy

- [x] Mobile responsive design (mobile-first)
- [ ] PWA manifest for home screen install
- [ ] Deploy to Fly.io or Railway
- [ ] Set up persistent volume for SQLite
- [ ] Environment variable configuration

## Commands

```bash
# Development
npm run dev                 # Start dev server at http://localhost:5173

# Database
npx prisma migrate dev      # Run migrations
npx prisma studio           # Visual database browser
bunx tsx prisma/seed.ts     # Seed initial data (uses tsx, not bun, for native modules)

# Build & Deploy
npm run build
npm run preview
```

## Environment Variables

```env
# Database URL is configured in prisma.config.ts, not .env
# SQLite file is at project root: dev.db

# Required for AI assistant (Phase 6)
ANTHROPIC_API_KEY="sk-ant-..."
```

## File Structure

```
breaking-beard/
├── prisma/
│   ├── schema.prisma           # Database schema with all models
│   ├── prisma.config.ts        # Prisma 7 config (driver adapter settings)
│   ├── seed.ts                 # Seeds oils and pairings from inventory
│   └── migrations/
├── dev.db                      # SQLite database (at project root)
├── src/
│   ├── lib/
│   │   ├── components/         # (Shared components as needed)
│   │   └── server/
│   │       ├── db.ts           # Prisma client with better-sqlite3 adapter
│   │       └── generated/      # Prisma generated client
│   │           └── prisma/
│   ├── routes/
│   │   └── ... (see route structure above)
│   ├── app.css                 # Global styles, Tailwind imports
│   ├── app.d.ts
│   └── app.html
├── static/
├── .env                        # ANTHROPIC_API_KEY (when AI assistant added)
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
import Database from 'better-sqlite3';

const sqlite = new Database('dev.db');
const adapter = new PrismaBetterSqlite3(sqlite);
export const db = new PrismaClient({ adapter });
```

Database file is at project root (`dev.db`), not in the prisma folder. Seed script uses `bunx tsx` (not `bun`) because better-sqlite3 is a native module.

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

- **Colors**: Amber/leather palette using oklch color space
- **Fonts**: Playfair Display (headings), Inter (body)
- **Custom classes**: `.btn-vintage`, `.card-glass`, `.fab`, `.diary-entry`
- **Scent category badges**: `.badge-citrus`, `.badge-woody`, `.badge-herbal`, etc.
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


### Route Implementation Status

| Route                | Status | Features                                             |
| -------------------- | ------ | ---------------------------------------------------- |
| `/` (Dashboard)      | ✓      | Stats, recent formulas, test logs, quick diary entry |
| `/formulations`      | ✓      | List with purpose filter                             |
| `/formulations/new`  | ✓      | Create with oil selection                            |
| `/formulations/[id]` | ✓      | View/edit, oil management, test logs with ratings    |
| `/oils/carrier`      | ✓      | List, add, edit                                      |
| `/oils/essential`    | ✓      | List with pairing management                         |
| `/diary`             | ✓      | Journal entries                                      |
| `/calculator`        | ✓      | Batch size, oil drops, dilution %, safety indicator  |
| `/assistant`         | ○      | Not yet implemented                                  |
