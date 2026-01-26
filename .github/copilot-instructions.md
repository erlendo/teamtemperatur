# Team Temperature App - Copilot Instructions

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS (to be implemented)
- **Deployment**: Vercel
- **Validation**: Zod (to be integrated)

## Enforced Standards (Auto-checked)

**This workspace has automated enforcement:**
- ✅ ESLint catches errors before save (.eslintrc.js)
- ✅ Prettier formats on save (.prettierrc)
- ✅ TypeScript strict mode + noUncheckedIndexedAccess (tsconfig.json)
- ✅ Pre-commit hooks run lint + format (husky + lint-staged)
- ⚠️ VSCode settings enforce formatOnSave + organizeImports

**When suggesting code:**
1. NO `any` types - use proper TypeScript
2. NO unused variables (prefix with `_` if intentional)
3. NO floating promises - always await or handle
4. Server actions MUST validate input with Zod first
5. Array access MUST check `undefined` (noUncheckedIndexedAccess)

## Architecture

### Database Schema (Supabase)
- `teams` - team metadata, settings
- `team_memberships` - user roles (owner/admin/member/viewer)
- `questionnaires` - multi-version survey templates
- `questions` - individual questions (scale_1_5, yes_no, text)
- `submissions` - weekly responses (unique per user/week/team)
- `answers` - individual answer values

### Key Patterns
1. **Row-Level Security (RLS)**: All data access controlled by Supabase policies
2. **Server Actions**: Use `'use server'` for mutations (createTeam, submitSurvey, etc.)
3. **Supabase Client**: 
   - Browser: `supabaseClient()` from `@/lib/supabase/client`
   - Server: `supabaseServer()` from `@/lib/supabase/server`
4. **Auth**: Magic link OTP via Supabase Auth
5. **Multi-team**: Users can belong to multiple teams with different roles

## Code Conventions

### File Structure
```
app/
  (app)/          # Authenticated routes
    teams/        # Team listing
    t/[teamId]/   # Team-specific pages (survey, stats, settings)
  (auth)/         # Public auth routes (login, signup)
lib/
  supabase/       # Supabase client utilities
server/
  actions/        # Server actions (mutations)
```

### Naming
- Server actions: `createTeam`, `submitSurvey`, `updateTeamSize`
- Components: PascalCase, co-locate with routes when route-specific
- Types: export from `types.ts` or inline when simple

### Best Practices
1. **Always validate input** with Zod before server actions
2. **Use RLS policies** instead of manual auth checks
3. **Prefer server components** unless interactivity needed
4. **Error handling**: Return `{error: string}` from server actions
5. **Loading states**: Use `useTransition()` for mutations
6. **Type safety**: Let TypeScript infer types; use `satisfies` over casts
7. **Imports**: Use `@/` path alias for cleaner imports

## Current State (Jan 2026)

### ✅ Completed
- Database schema + RLS policies
- Auth flow (login/logout)
- Basic pages: teams list, survey form, stats
- Server actions: createTeam, submitSurvey

### 🚧 In Progress
- Tailwind styling (replace inline styles)
- Zod validation integration
- Bayesian index + moving average calculations (port from old HTML app)
- History table + detail expansion

### ❌ TODO
- Admin panel (questionnaire CRUD, team member invites)
- Export/import functionality
- Form validation UI feedback
- Mobile responsive design
- Default questionnaire seeding

## Migration Notes

This app is being migrated from:
- **Old**: Static HTML + PHP + JSON file storage
- **New**: Next.js + Supabase + Vercel

Legacy files (`team-temperature-app.html`, `team-temperature-api.php`) will be removed once migration is complete.

## Environment Variables

Required in `.env.local` and Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

## Key Business Logic

### Team Health Index Calculation
1. **Raw Score**: Average of 10 metrics (feeling, motivation, workload, stress, clarity, expectations, collaboration, communication, feedback, recognition) - scale 1-5
2. **Bayesian Adjustment**: `(n * rawScore + k' * 3) / (n + k')` where `k' = 3 * (1 - responseRate) + 1`
3. **Moving Average**: `0.6 * current + 0.3 * previous + 0.1 * twoWeeksAgo`

### RLS Helper Functions
- `is_team_member(team_id)` - checks active membership
- `team_role(team_id)` - returns user's role in team
- `get_team_week_stats(team_id, week)` - aggregated stats RPC

## Common Tasks

**Add a new question type:**
1. Update `questions.type` enum in migration
2. Add validation in submission form
3. Update `answers` storage logic

**Change team permissions:**
1. Modify RLS policies in `001_init.sql`
2. Re-run migration or update via Supabase Dashboard

**Add a new page:**
1. Create `app/(app)/t/[teamId]/your-page/page.tsx`
2. Add server action if mutation needed
3. Link from team nav
