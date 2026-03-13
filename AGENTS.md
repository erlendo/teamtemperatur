# Teamtemperatur - Codex Guide

## 📋 Prosjektoversikt

**Teamtemperatur** er en full-stack Next.js-applikasjon for å måle og følge teamhelse over tid. Appen kombinerer ukentlige helseundersøkelser med et samarbeidsdashboard for å håndtere teammål, pipeline-items, ukemål og retrospektiver.

### Kjerneformål

- **Ukentlige helseundersøkelser**: Team vurderer trivsel på skala 1-5 hver uke
- **Dashboard med samarbeidselementer**: Organisere og koble sammen mål, pipeline, ukemål og retro
- **Statistikk og trendanalyse**: Visualisere teamhelse med avanserte beregninger (Bayesian adjustment, moving averages)
- **Relasjoner mellom items**: Many-to-many koblinger mellom ulike item-typer

### Språk

- **UI**: Norsk
- **Kode**: Engelsk (variabelnavn, funksjoner, kommentarer)
- **Database**: Engelsk (tabellnavn, kolonner)

---

## 🏗️ Teknologistack

### Frontend

- **Next.js 14.2.35** - App Router med Server/Client Components
- **React 18.3.1** - UI library
- **TypeScript 5** - Strict mode aktivert
- **Recharts 3.7.0** - Statistikk-visualisering
- **@dnd-kit** - Drag-and-drop funksjonalitet
- **Lucide React** - Ikoner
- **Zod 3.23.8** - Schema validation

### Backend

- **Next.js Server Actions** - Primær backend-pattern (ikke traditional API routes)
- **Supabase 2.49.1** - PostgreSQL + Auth + Real-time
- **@supabase/ssr** - Server-side rendering utilities
- **pg 8.17.2** - Direct PostgreSQL client for migrations

### Deployment

- **Vercel** - Frontend hosting
- **Supabase** - Database (managed PostgreSQL)

---

## 📁 Filstruktur og Arkitektur

```
/Users/erlendo/Teamtemperatur/
├── app/                              # Next.js App Router
│   ├── (app)/                       # Protected app routes (route group)
│   │   ├── t/[teamId]/              # Team-specific dynamic routes
│   │   │   ├── page.tsx             # Dashboard (hovedvisning)
│   │   │   ├── client.tsx           # Client-side state management
│   │   │   ├── survey/page.tsx      # Ukentlig undersøkelse
│   │   │   ├── stats/page.tsx       # Statistikk og trender
│   │   │   └── admin/page.tsx       # Admin panel (kun for owners)
│   │   └── teams/page.tsx           # Team listing
│   ├── (auth)/                      # Auth routes (route group)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── logout/route.ts
│   ├── api/migrate/route.ts         # Migration utility endpoint
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home (redirects)
│   └── globals.css                  # Global styles + design tokens

├── components/                       # Reusable React components
│   ├── DashboardGrid.tsx            # Main dashboard med drag-and-drop
│   ├── DashboardSection.tsx         # Section for item-grupper
│   ├── TeamItemCard.tsx             # Item card med medlemmer/tags/status
│   ├── HealthCard.tsx               # Team health metrics display
│   ├── RelationConnectors.tsx       # Visuelle koblinger mellom items
│   ├── RelationGuide.tsx            # Help modal for relationships
│   ├── RelationToggle.tsx           # Toggle synlighet av relasjoner
│   ├── YearStatsView.tsx            # Statistikk-visualisering (Recharts)
│   ├── AppHeader.tsx                # Navigation header
│   ├── AdminUserProfiles.tsx        # Admin user management
│   └── [other UI components]        # Buttons, inputs, modals, etc.

├── server/                           # Server-side logic
│   ├── actions/                     # Server Actions (RPC-like)
│   │   ├── auth.ts                  # Authentication (login, signup, reset)
│   │   ├── teams.ts                 # Team CRUD + membership management
│   │   ├── dashboard.ts             # Item + relation management (1000+ lines)
│   │   ├── submissions.ts           # Survey submission logic
│   │   ├── stats.ts                 # Statistics calculations
│   │   └── drafts.ts                # Survey draft saving
│   └── queries/                     # Database queries
│       └── questionnaires.ts        # Load active questionnaires

├── hooks/                            # Custom React hooks
│   └── useVisibleRelations.ts       # Manage visibility state for relations

├── lib/                              # Utilities
│   └── supabase/
│       ├── server.ts                # Server-side Supabase client
│       └── browser.ts               # Browser-side Supabase client

├── supabase/                         # Database migrations
│   └── migrations/                  # SQL migration files (39+ files)
│       ├── 001_init.sql             # Initial schema
│       ├── 002_default_questionnaire.sql
│       ├── 026_create_team_items_tables.sql
│       ├── 039_add_archive_fields_team_items.sql
│       └── [other migrations]

├── middleware.ts                     # Next.js middleware (OTP, auth)
├── package.json
├── tsconfig.json                    # Strict mode TypeScript
├── next.config.js
└── .env.local                       # Environment variables (gitignored)
```

---

## 🗄️ Database Schema

### Core Tables

#### Teams & Membership

```sql
teams
├── id (uuid, primary key)
├── name (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

team_memberships
├── id (uuid, primary key)
├── team_id (uuid, foreign key → teams)
├── user_id (uuid, foreign key → auth.users)
├── role (text: 'owner' | 'admin' | 'member' | 'viewer')
├── created_at (timestamptz)
└── is_active (boolean, default true)

user_profiles
├── id (uuid, primary key, matches auth.users.id)
├── email (text)
├── first_name (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

#### Questionnaires & Surveys

```sql
questionnaires
├── id (uuid, primary key)
├── team_id (uuid, foreign key → teams)
├── title (text)
├── is_active (boolean)
├── created_at (timestamptz)
└── updated_at (timestamptz)

questions
├── id (uuid, primary key)
├── questionnaire_id (uuid, foreign key → questionnaires)
├── text (text)
├── type (text: 'scale' | 'yes_no' | 'text')
├── sort_order (integer)
└── created_at (timestamptz)

submissions
├── id (uuid, primary key)
├── questionnaire_id (uuid, foreign key → questionnaires)
├── team_id (uuid, foreign key → teams)
├── user_id (uuid, foreign key → auth.users)
├── week_number (integer, 1-53)
├── year (integer)
├── submitted_at (timestamptz)
└── UNIQUE(team_id, user_id, year, week_number) -- Én submission per bruker per uke

answers
├── id (uuid, primary key)
├── submission_id (uuid, foreign key → submissions)
├── question_id (uuid, foreign key → questions)
├── value (text) -- '1'-'5' for scale, 'yes'/'no', or free text
└── created_at (timestamptz)

tt_draft_answers (draft saving)
├── id (uuid, primary key)
├── team_id (uuid)
├── user_id (uuid)
├── year (integer)
├── week_number (integer)
├── question_id (uuid)
├── value (text)
└── created_at (timestamptz)
```

#### Dashboard Items (Collaborative Elements)

```sql
team_items
├── id (uuid, primary key)
├── team_id (uuid, foreign key → teams)
├── type (text: 'ukemaal' | 'pipeline' | 'maal' | 'retro')
├── title (text, not null)
├── description (text)
├── status (text: 'planned' | 'in_progress' | 'completed', default 'planned')
├── sort_order (integer, default 0) -- For drag-and-drop ordering
├── created_at (timestamptz)
├── updated_at (timestamptz)
├── created_by (uuid, foreign key → auth.users)
├── is_archived (boolean, default false)
└── archived_at (timestamptz, nullable)

team_item_members (many-to-many)
├── id (uuid, primary key)
├── team_item_id (uuid, foreign key → team_items)
├── user_id (uuid, foreign key → auth.users)
└── created_at (timestamptz)

team_item_tags (many-to-many)
├── id (uuid, primary key)
├── team_item_id (uuid, foreign key → team_items)
├── tag (text, not null)
└── created_at (timestamptz)

team_item_relations (many-to-many)
├── id (uuid, primary key)
├── source_item_id (uuid, foreign key → team_items)
├── target_item_id (uuid, foreign key → team_items)
├── relation_type (text: 'next_step' | 'part_of')
└── created_at (timestamptz)
```

### Database Functions & RLS

**Helper Functions:**

- `is_team_member(team_uuid, user_uuid)` - Check if user is member
- `team_role(team_uuid, user_uuid)` - Get user's role in team
- `get_team_week_stats(team_uuid, year_int, week_int)` - Calculate weekly stats with Bayesian adjustment

**Row-Level Security (RLS):**

- All tables have RLS enabled
- Policies enforce team membership boundaries
- Some aggregation functions use `security definer` to bypass RLS for calculations

---

## 🎯 Viktige Konsepter

### 1. Item Types (Dashboard)

Fire typer team items med distinkte roller:

| Type       | Norsk navn | Farge      | Formål                                 |
| ---------- | ---------- | ---------- | -------------------------------------- |
| `ukemaal`  | Ukemål     | Gray       | Ukentlige mål/oppgaver                 |
| `pipeline` | Pipeline   | Green      | Pipeline-elementer som leverer til mål |
| `maal`     | Mål        | Teal       | Overordnede mål                        |
| `retro`    | Retro      | Amber/Gold | Retrospektiv forbedringer              |

### 2. Item Relations (Many-to-Many)

**Relation Types:**

- `next_step` - Dette item er neste steg fra source
- `part_of` - Dette item er del av source

**Eksempel:**

```
Pipeline A → (next_step) → Ukemål X
Pipeline A → (part_of) → Mål Y
Pipeline B → (next_step) → Ukemål X  (many-to-many!)
```

**Recent Evolution:**

- Tidligere: One-to-one per source
- Nå: Full many-to-many support (flere kilder → ett target, ett source → flere targets)

### 3. Statistics Calculations

Tre beregningsmetoder for team health scores:

**A. Raw Score**

```typescript
Simple average of all responses
Example: [4, 5, 3, 4, 5] → 4.2
```

**B. Bayesian Adjusted Score**

```typescript
// Trekker ikke-respondenter mot midten (3.0)
// Premierer høy deltakelse
const totalMembers = 10;
const responses = 7;
const rawScore = 4.2;

// Formula: (responses * rawScore + (totalMembers - responses) * 3.0) / totalMembers
bayesianScore = (7 * 4.2 + 3 * 3.0) / 10 = 3.84
```

**C. Moving Average**

```typescript
// Glatter trender med vektet historikk
movingAvg = 0.6 * currentWeek + 0.3 * lastWeek + 0.1 * twoWeeksAgo
```

### 4. Survey Submission Rules

- **Én submission per bruker per uke** (enforced by unique constraint)
- Brukere kan **overskrive** sin egen submission i samme uke
- **Draft saving**: Ufullstendige submissions lagres i `tt_draft_answers`
- Drafts slettes automatisk ved faktisk submission

### 5. Authorization Levels

**Roller (i rekkefølge av tilgang):**

1. `owner` - Full tilgang, kan slette team
2. `admin` - Kan administrere medlemmer, items, settings
3. `member` - Kan svare på undersøkelser, se dashboard, lage items
4. `viewer` - Read-only tilgang

**Defense in Depth:**

1. Middleware sjekker session validity
2. Server Actions verifiserer team membership
3. RLS policies på database-nivå

---

## 🎨 Kodestandarder og Patterns

### Server Actions Pattern (Viktig!)

**ALLTID bruk Server Actions for backend logic - IKKE traditional API routes.**

```typescript
// ✅ RIKTIG: server/actions/example.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function exampleAction(teamId: string, data: any) {
  const supabase = await createClient()

  // 1. Autentisering
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // 2. Autorisering - sjekk team membership
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) {
    return { error: 'Not a team member' }
  }

  // 3. Business logic
  const { data, error } = await supabase
    .from('some_table')
    .insert({ ...data, team_id: teamId })
    .select()
    .single()

  if (error) {
    console.error('Error in exampleAction:', error)
    return { error: error.message }
  }

  // 4. Cache invalidation
  revalidatePath(`/t/${teamId}`)

  return { data }
}
```

**Returformat:**

- Success: `{ data: T }`
- Error: `{ error: string }`
- Aldri throw errors - returner alltid et objekt

### Client Component Patterns

```typescript
// ✅ Client component som bruker Server Actions
'use client';

import { useState } from 'react';
import { exampleAction } from '@/server/actions/example';

export default function ExampleComponent({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await exampleAction(teamId, {
      title: formData.get('title')
    });

    if (result.error) {
      alert(result.error); // Eller bedre error handling
    } else {
      // Success handling
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Drag-and-Drop Pattern (DndKit)

```typescript
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// I component:
const [items, setItems] = useState(initialItems);

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  // Update local state optimistically
  const oldIndex = items.findIndex(i => i.id === active.id);
  const newIndex = items.findIndex(i => i.id === over.id);
  const newItems = arrayMove(items, oldIndex, newIndex);
  setItems(newItems);

  // Persist to database
  updateItemOrder(active.id, newIndex);
}

return (
  <DndContext onDragEnd={handleDragEnd}>
    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
      {items.map(item => <SortableItem key={item.id} item={item} />)}
    </SortableContext>
  </DndContext>
);
```

### Design Tokens (CSS Variables)

Alle farger og spacing er definert som CSS custom properties i `app/globals.css`:

```css
:root {
  /* Colors - Nordic/Scandinavian palette */
  --color-primary: #2d6a5c; /* Teal green */
  --color-secondary: #4a7c6f; /* Lighter teal */
  --color-accent: #d4af37; /* Gold */

  /* Item type colors */
  --color-ukemaal: #6b7280; /* Gray */
  --color-pipeline: #059669; /* Green */
  --color-maal: #0d9488; /* Teal */
  --color-retro: #f59e0b; /* Amber */

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

**Bruk disse i komponenter:**

```css
.item-card {
  padding: var(--spacing-md);
  background: var(--color-primary);
}
```

---

## 🔧 Vanlige Oppgaver

### Legge til en ny Server Action

1. Opprett/åpne fil i `server/actions/`
2. Legg til `'use server';` på toppen
3. Implementer function med auth + authorization checks
4. Returner `{ data }` eller `{ error }`
5. Bruk `revalidatePath()` for cache invalidation
6. Import og bruk i client components

### Legge til et nytt felt på team_items

1. **Database migration**: Opprett ny SQL-fil i `supabase/migrations/`

```sql
-- 040_add_field_to_team_items.sql
ALTER TABLE team_items ADD COLUMN new_field TEXT;
```

2. **Type definitions**: Oppdater TypeScript types (sjekk eksisterende for pattern)

3. **Server Actions**: Oppdater relevant logic i `server/actions/dashboard.ts`

4. **UI Components**: Oppdater `TeamItemCard.tsx` eller relevante komponenter

5. **Kjør migration**: Via Supabase dashboard eller migration endpoint

### Legge til en ny item type

1. Legg til ny type i `team_items.type` column (database constraint)
2. Oppdater TypeScript types
3. Legg til farge i `globals.css` (`--color-newtype`)
4. Oppdater `DashboardGrid.tsx` for å vise ny section
5. Oppdater filtering logic i dashboard-queries

### Legge til nytt spørsmål i survey

Spørsmål opprettes via `questionnaires` og `questions` tabeller. For MVP:

1. Insert direkte i database via Supabase dashboard:

```sql
INSERT INTO questions (questionnaire_id, text, type, sort_order)
VALUES (
  'questionnaire-uuid-here',
  'Hvordan går det med teamarbeidet?',
  'scale',
  10
);
```

2. (Fremtidig feature: Admin UI for å håndtere spørsmål)

---

## ⚠️ Viktige Ting å Huske På

### ALDRI gjør dette:

- ❌ Bruk tradisjonelle Next.js API routes for backend logic (bruk Server Actions)
- ❌ Hardcode team_id eller user_id uten å verifisere membership
- ❌ Throw errors fra Server Actions (returner `{ error }` i stedet)
- ❌ Glem `revalidatePath()` etter mutations
- ❌ Skip autorisasjonssjekker i Server Actions (selv om RLS er aktiv)
- ❌ Bruk `SELECT *` - vær eksplisitt om hvilke kolonner du trenger
- ❌ Lag flere submissions per bruker per uke (enforced av unique constraint, men valider før insert)

### ALLTID gjør dette:

- ✅ Sjekk `auth.getUser()` først i alle Server Actions
- ✅ Verifiser team membership før operasjoner
- ✅ Bruk `revalidatePath()` etter data mutations
- ✅ Log errors med context: `console.error('Context:', error)`
- ✅ Returner tydelige error messages til brukeren
- ✅ Bruk TypeScript strict mode (allerede aktivert)
- ✅ Test både success og error cases
- ✅ Bruk design tokens fra `globals.css` i stedet for hardcoded colors

### Performance Considerations

- Supabase har connection limits - reuse clients hvor mulig
- Dashboard queries kan være tunge med mange items - vurder pagination hvis >100 items
- Statistics calculations kjøres server-side (security definer functions)
- Recharts kan være treg med >52 datapunkter - vurder sampling for lange tidsperioder

### Database Migrations

- ALDRI endre eksisterende migrations (001-039)
- Opprett NYE migrations med inkrementelt nummer
- Test migrations i development environment først
- Bruk descriptive filenames: `040_add_field_description.sql`
- Inkluder både UP og DOWN migration hvis mulig (rollback)

---

## 🚀 Deployment og Miljø

### Environment Variables (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Kun for migrations
```

### Vercel Deployment

1. Import repo til Vercel
2. Sett environment variables i Project Settings
3. Deploy (automatic on push to main)

### Supabase Setup

1. Kjør alle migrations i rekkefølge (001 → 039+)
2. Verifiser at RLS er enabled på alle tables
3. Test permissions med test users

### Testing Workflow

```bash
# Development
npm run dev

# Tests
npm run test:run

# Type check
npm run type-check

# Linting
npm run lint

# Full agent verification
npm run check:agent-ready

# Format
npm run format
```

### Agent Loop

For agentdrevet arbeid i denne kodebasen bør standardløkken være:

1. Les eksisterende mønster i berørte filer før du foreslår ny struktur
2. Hold Supabase-kall på serversiden og mutasjoner i `server/actions/`
3. Kall inn UX-spesialist når endringen påvirker flyt, mikrotekst, layout, tilgjengelighet eller visuell kvalitet
4. Trekk ut ren, testbar logikk når en endring er mer enn trivielt UI-arbeid
5. Kjør `npm run check:agent-ready` før du anser endringen som ferdig
6. Kjør `npm run check:migrations -- <files>` i tillegg når SQL-migrations er endret

### Agentroller i repoet

- `orchestrator`: Koordinerer spesialistene for større oppgaver
- `planner`: Lager gjennomførbar rekkefølge med lav regressjonsrisiko
- `ux-designer`: Forbedrer brukervennlighet, informasjonsarkitektur, mikrotekst, tilgjengelighet og visuell kvalitet
- `frontend-runtime`: Fanger stale state, optimistic UI-feil, query-param-/tab-bytter og andre interaktive runtime-regresjoner
- `performance`: Fanger bundle-vekt, N+1 reads, unødvendig renderarbeid, tunge charts og svak lazy-loading/cache-strategi
- `architecture-guard`: Passer på at UI, server actions og datalag holder riktige grenser
- `db-security`: Fanger auth-, scope- og migrasjonsrisiko
- `review`: Prioriterer bugs, regressjoner og manglende tester
- `quality-gate`: Verifiserer at endringen faktisk er merge-klar

### Agenthierarki

- Bruk grunt hierarki: `orchestrator` -> `planner` -> relevante spesialister
- Ikke legg inn flere lag enn nødvendig; målet er tydelig ansvar, ikke agent-byråkrati
- Ved interaktive UI-endringer skal `ux-designer`, `frontend-runtime` og `quality-gate` normalt være med
- Ved tunge data- eller visualiseringsflater skal `performance` vurderes eksplisitt

### UX-kvalitet

- Når én side i en flyt oppdateres visuelt, skal nærliggende sider i samme flyt vurderes for samme oppgradering
- Premium uttrykk betyr rolig hierarki, konsistente kort- og knappemønstre, tydelige tilstander og disiplinert bruk av aksentfarger
- Typografi skal bruke en liten, konsistent skala fra `app/globals.css`; unngå tilfeldige mikrofont-størrelser som gjør flater ujevne
- Statusfarger skal være semantisk tydelige: planlagt, pågår og ferdig må kunne skilles raskt uten å lese tekstetiketten
- Survey- og skjema-flater skal optimaliseres for rask utførelse: store trefflater, lav skannekostnad og tydelig fremdrift
- Unngå blanding av gamle og nye mønstre på auth-sider, teamoversikt og andre primære arbeidsflater
- Unngå tilfeldig bruk av emojis i overskrifter og primære grensesnitt-elementer

### Branching Strategy

- `main` - Production branch
- Feature branches: `feature/description`
- Hotfix branches: `hotfix/description`

---

## 📚 Viktige Filer å Kjenne Til

| Fil                                                    | Formål                                         |
| ------------------------------------------------------ | ---------------------------------------------- |
| `server/actions/dashboard.ts`                          | 1000+ linjer - all item + relation logic       |
| `server/actions/submissions.ts`                        | Survey submission + draft handling             |
| `server/actions/stats.ts`                              | Statistics calculations (Bayesian, moving avg) |
| `components/DashboardGrid.tsx`                         | Main dashboard med drag-and-drop               |
| `components/TeamItemCard.tsx`                          | Item display med medlemmer/tags/status         |
| `app/(app)/t/[teamId]/client.tsx`                      | Client-side state for dashboard                |
| `app/globals.css`                                      | Design tokens og global styles                 |
| `middleware.ts`                                        | OTP exchange og auth checks                    |
| `supabase/migrations/026_create_team_items_tables.sql` | Team items schema                              |

---

## 🎓 Læring og Dokumentasjon

### Nyttige Ressurser

- [Next.js 14 App Router Docs](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [DndKit Documentation](https://docs.dndkit.com/)
- [Recharts Examples](https://recharts.org/en-US/examples)

### Konvensjoner

- **Filnavn**: PascalCase for components (`TeamItemCard.tsx`), lowercase for routes (`page.tsx`)
- **Function names**: camelCase (`handleSubmit`, `createTeamItem`)
- **Database**: snake_case (`team_id`, `created_at`)
- **CSS classes**: kebab-case (`.item-card`, `.health-score`)

---

## 🐛 Debugging Tips

### Common Issues

**"Not authorized" errors:**

- Sjekk om user er authenticated: `supabase.auth.getUser()`
- Sjekk team membership: Query `team_memberships` table
- Verifiser RLS policies i Supabase dashboard

**Drag-and-drop ikke fungerer:**

- Sjekk at items har unique `id` property
- Verifiser at `SortableContext` items array matcher rendered items
- Console.log `DragEndEvent` for å se hva som skjer

**Statistics viser feil tall:**

- Verifiser `week_number` og `year` i submissions
- Sjekk at `get_team_week_stats()` function er oppdatert
- Test Bayesian calculations manuelt

**Cache issues (stale data):**

- Sjekk at `revalidatePath()` kalles etter mutations
- Prøv hard refresh (Cmd+Shift+R)
- Verifiser at riktig path sendes til `revalidatePath()`

---

## 📝 Commit Message Convention

Følg denne stilen (basert på existing commit history):

```
Add team item archiving
Aktivér many-to-many relasjoner: pipeline kan levere på flere mål
Fix: beholde en-til-en per source, men tillat mange til same target
Fjern auto-delete logikk - tillat many-to-one relasjoner
```

- Start med verb (Add, Fix, Update, Fjern, etc.)
- Bruk norsk eller engelsk konsistent per commit
- Vær beskrivende men konsis
- Inkluder "Fix:" prefix for bugfixes

---

## 🎯 Fremtidige Features (Vurder disse ved utvidelse)

- Admin UI for å håndtere spørsmål i questionnaires
- Invitasjonssystem for å legge til nye teammedlemmer
- Email notifications for påminnelser om weekly survey
- Export statistics til PDF/Excel
- Real-time collaborative editing (Supabase Realtime)
- Mobile app (React Native)
- AI-powered insights fra survey responses
- Integration med Slack/Teams for notifications

---

## 🤝 Samarbeid med Codex

Når du jobber med meg (Codex) i dette prosjektet:

1. **Vær spesifikk**: "Legg til et nytt felt 'priority' på team_items" i stedet for "Oppdater databasen"
2. **Gi kontekst**: Hvis du refererer til et spesifikt item type eller feature, si hvilket
3. **Test sammen**: La meg vite hvis noe ikke fungerer, så kan jeg debugge
4. **Iterer**: Start smått, test, så bygg videre

Jeg har nå full kontekst om prosjektet og kan hjelpe deg med:

- Legge til nye features
- Debugge issues
- Refaktorere kode
- Skrive migrations
- Optimalisere performance
- Forklare eksisterende kode

**Lykke til med utviklingen! 🚀**
