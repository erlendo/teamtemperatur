# Team Temperature App - Copilot Instructions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Inline styles + Tailwind CSS utilities (gradual migration in progress)
- **Icons**: lucide-react for consistent UI components
- **Drag-Drop**: @dnd-kit for task reordering
- **Deployment**: Vercel
- **Package Manager**: npm

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
4. Server actions MUST validate input with Zod first (planned)
5. Array access MUST check `undefined` (noUncheckedIndexedAccess)
6. Icons MUST use lucide-react library consistently

## Architecture

### Database Schema (Supabase)

- `teams` - team metadata, settings
- `team_memberships` - user roles (owner/admin/member/viewer)
- `user_profiles` - user metadata (first_name for display)
- `team_items` - dashboard tasks (ukemål, pipeline, mål, retro)
- `team_item_members` - who is assigned to each task
- `team_item_tags` - labels for tasks
- `questionnaires` - survey templates (multi-version)
- `questions` - survey questions with scoring rules
- `submissions` - weekly survey responses
- `answers` - individual answer values per question

### Key Patterns

1. **Row-Level Security (RLS)**: All data access controlled by Supabase policies
2. **Server Actions**: Use `'use server'` for mutations with error handling
3. **Supabase Client**:
   - Browser: `supabaseBrowser()` from `@/lib/supabase/browser`
   - Server: `supabaseServer()` from `@/lib/supabase/server`
4. **Auth**: Magic link OTP via Supabase Auth + email verification
5. **User Profiles**: Captured at signup, managed in admin panel
6. **Dashboard Items**: Sortable via drag-drop, editable in modal

## Code Conventions

### File Structure

```
app/
  (app)/               # Authenticated routes
    teams/             # Team listing
    t/[teamId]/        # Team-specific pages
      /page.tsx        # Dashboard with items + health stats
      /stats/          # Detailed health statistics
      /survey/         # Weekly survey submission
      /admin/          # Admin panel (owner only)
  (auth)/              # Public auth routes (login, signup)
lib/
  supabase/            # Supabase client utilities
server/
  actions/             # Server actions (mutations)
components/
  *Card.tsx            # Dashboard card components
  Admin*.tsx           # Admin panel components
```

### Naming & Styling

- Server actions: `createTeam`, `updateItem`, `saveFirName`
- Components: PascalCase, co-locate with routes when route-specific
- Colors (Nordic Palette): Blue (#E3F2FD), Yellow (#FFFACD), Green (#E8F5E9)
- Spacing: Use CSS variables `var(--space-xs)` to `var(--space-3xl)`
- Font sizes: `12px` for compact, `13px` for body text

### Best Practices

1. **Always validate input** before server actions
2. **Use RLS policies** instead of manual auth checks
3. **Prefer server components** unless interactivity needed
4. **Error handling**: Return `{error: string}` from server actions; display in UI
5. **Loading states**: Use `useTransition()` for mutations + visual feedback
6. **Type safety**: Explicit types, avoid `any`
7. **Icons**: Always use lucide-react, size 18px for consistency

## Recent Improvements (Feb 2026)

### Dashboard Optimization

- ✅ 3-column grid layout (Ukemål | Pipeline | Mål)
- ✅ Helse card (Health metrics) → full-width Row 2
- ✅ Retro section → separate Row 3
- ✅ Compact view mode (title + tags + members, no edit UI)
- ✅ Edit mode toggle with pencil icon
- ✅ Nordic nature colors (planned > completed)
- ✅ HealthCard compacted to match TeamItemCard sizing

### User Profiles & Display Names

- ✅ `user_profiles` table with `first_name` column (Migration 027)
- ✅ Signup form captures `first_name` (required field)
- ✅ Dashboard displays first_name instead of email
- ✅ Avatar initials from first_name (e.g., "Erlend" → "ER")
- ✅ Admin panel for team owners to manage user first_names
- ✅ Inline editing + real-time save in admin interface

### Task Management Features

- ✅ Tags display in view mode (blue badges)
- ✅ Members display in view mode (avatar circles with initials)
- ✅ Hover on avatar shows member's first_name
- ✅ Drag-drop reordering (fully functional)
- ✅ Delete with RLS verification
- ✅ Edit mode for status (dropdown), members (+ add), tags (input)
- ✅ Icon consistency: lucide-react for all icons (Pencil, Trash2, AlertCircle)

## Current State (Feb 2026)

### ✅ Completed

- Database schema + RLS all tiers
- Auth flow (magic link OTP + email verification)
- Dashboard with 3-column layout + health stats
- Task management (create, edit, delete, reorder, tags, members)
- User profiles (first_name collection + display)
- Admin panel (user profile management)
- Compact visual design (Nordic color palette)
- Weekly survey submission
- Health statistics page
- Team creation + membership

### 🚧 In Progress

- Zod validation integration
- Mobile responsive breakpoints
- Additional admin features (questionnaire CRUD)

### ❌ TODO

- Export/import tasks
- Advanced filtering + search
- Recurring tasks or templates
- Comment/discussion system
- Custom questionnaire management
- Team invites via email
- Bulk user profile import

## Environment Variables

Required in `.env.local` and Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

## Key Components

### TeamItemCard (`components/TeamItemCard.tsx`)

- Displays task with title, status color, tags, assigned members
- View mode: Read-only, shows all metadata
- Edit mode: Toggle via pencil icon, edit title/status/members/tags
- Drag-drop enabled via @dnd-kit
- Error display inline

### DashboardSection (`components/DashboardSection.tsx`)

- Container for grouped items (Ukemål, Pipeline, Mål, Retro)
- Handles drag-drop context, reordering, item creation
- Color-coded by section type

### HealthCard (`components/HealthCard.tsx`)

- Displays team health score (1-5 scale)
- Trend chart (last 6 weeks)
- Response rate + member count
- Compact design matching TeamItemCard

### AdminUserProfiles (`components/AdminUserProfiles.tsx`)

- Table of team members with email + first_name
- Inline editing: click "Rediger" to update first_name
- Save/Cancel buttons
- Real-time feedback + error handling
- Shows count of members without names

## Authentication & Authorization

### User Signup

1. Enter first_name (required), email, password
2. `saveUserProfile()` stores first_name in `user_profiles` table
3. Email verification (if configured)
4. Auto-redirect to `/teams` on success

### Admin Access

1. Check user role in `team_memberships` (owner only)
2. `/admin` page blocked if not owner (via server-side check)
3. `adminUpdateUserFirstName()` validates owner role before update

## Common Tasks

**Update a user's first_name:**

1. Go to `/t/[teamId]/admin`
2. Find user in "Bruker-fornavn" section
3. Click "Rediger" → type name → click "Lagre"

**Add permissions for new feature:**

1. Modify RLS policies in Supabase migration
2. Test with `is_team_member()` helper in policies
3. Server actions verify permissions before mutations

**Style a new component:**

1. Use inline `style={{}}` with CSS variables
2. Spacing: `var(--space-md)`, `var(--space-lg)`
3. Colors: Use Nordic palette or `var(--color-primary)`
4. Fonts: `13px` body, `12px` for compact, `14px`+ for headers

**Add a new task type:**

1. Update ItemType enum in TeamItemCard.tsx
2. Add case in `type === 'new-type'` conditions
3. Create DashboardSection with appropriate color

## Migration & Cleanup

Last Cleanup: Feb 9, 2026

- ✅ Removed all debug/test files (debug-_.sql, test-_.mjs, etc.)
- ✅ Removed legacy implementations (team-temperature-\*.php/html)
- ✅ Removed migration guides (already completed)
- ✅ Cleaned up old test/analyze scripts
- ✅ Repository is now production-ready

Legacy files were migrated from:

- **Old**: Static HTML + PHP + JSON file storage
- **New**: Next.js + Supabase + Vercel
