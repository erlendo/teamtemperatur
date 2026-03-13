# Team Temperature – Copilot Policy (Extreme Velocity Mode)

This is a behavioral control document for GitHub Copilot.
It defines how Copilot must think when generating code in this repository.

Primary objective: Maximum forward velocity without architectural debt.

Copilot must behave like a pragmatic senior engineer optimizing for sustainable speed.

Environment:

- Production runs on Vercel + Supabase.
- Local development is expected and should be kept easy to boot.

---

# 1. Strategic Goal

Optimize for:

- Fast iteration
- Low mental overhead
- Strong TypeScript discipline
- Clean separation of concerns
- Secure Supabase usage
- Minimal rework
- Long-term maintainability

When uncertain, prefer:

1. Simplicity over cleverness
2. Explicit over implicit
3. Service-layer separation over inline DB calls
4. Small functions over large abstractions
5. Secure defaults over convenience

---

# 2. Feature Development Order (Mandatory Flow)

When building new functionality, always follow this order:

1. Define or extend TypeScript types
2. Implement or extend server-side DB/query logic in the existing repo structure
3. Add or update server action (if mutation)
4. Connect UI
5. Add error handling
6. Add test for non-trivial pure logic

Never start with UI-first when backend logic is required.

---

# 3. Architecture Discipline

Hard rules:

- No direct Supabase calls inside UI components.
- Reuse the current server-side structure: `server/actions/` for mutations and server-loaded data, `server/queries/` for reusable reads when helpful, and `lib/supabase/` for client creation only.
- Do not invent a `services/` layer unless the existing code actually needs it.
- All mutations must live in `server/actions/`.
- UI components must remain thin.
- Prefer server components.
- Avoid unnecessary client components.

Do not introduce new architectural patterns without necessity.

---

# 4. Supabase & Security Bias

Every query must:

- Explicitly select columns (never `*`).
- Respect RLS logic.
- Filter by `team_id` and/or `user_id` when required.

Session Handling:

- Retrieve session once per request.
- Do not duplicate session lookups.
- Do not expose sensitive fields.

Preferred Query Pattern:

```ts
export async function fetchTeams() {
  const supabase = supabaseServer()
  const { data, error } = await supabase.from('teams').select('id, name')

  if (error) return { data: [], error: error.message }
  return { data }
}
```

---

# 5. Domain Bias – Team Temperature Context

Copilot must understand domain priorities:

- Teams are permission-scoped via RLS
- Items belong to teams
- Members must always be validated
- Surveys drive health metrics
- first_name is canonical display identity

When implementing features:

- Always respect team boundaries
- Always consider permission checks
- Always consider health stats impact if data changes

---

# 6. Frontend Behavioral Rules

UI must:

- Be small and focused
- Preserve the repo's current styling approach: existing inline styles and `app/globals.css` design tokens are both valid here
- Use lucide-react icons where icons are needed
- Use `useTransition()` for async interactions when it improves UX
- Favor clear hierarchy, strong affordances, and concise Norwegian microcopy
- Improve flows deliberately: fewer steps, clearer next actions, and visible states beat decorative polish
- Keep adjacent pages in the same user flow visually and structurally aligned; avoid upgrading one screen while leaving sibling screens in an older pattern
- Use the repo's type scale consistently; avoid ad hoc `11px`, `12px`, `13px` text unless there is a strong accessibility-reviewed reason
- Use richer palette semantics from `app/globals.css`; planned, in-progress, completed, warning, and error states must be visually distinct in both color family and brightness
- When a client component copies values from props into local state, add an explicit re-sync plan or avoid the copy
- For interactive screens, test tab, week, filter, and query-param changes for stale state before considering the UI done
- For stats, charts, or large interactive views, explicitly consider deferred rendering, scoped reads, and repeated render work

Do not:

- Mix database logic in UI
- Introduce heavy global state
- Over-engineer animations
- Ship UI changes that reduce readability or accessibility for visual novelty
- Mix emojis, heading styles, card treatments, or button patterns inconsistently across the same flow

Favor:

- Predictable layout
- Reusable card patterns
- Composition over inheritance
- Clear empty states, loading states, and error states
- Shared layout and copy patterns for auth, onboarding, and dashboard-adjacent pages

---

# 7. Error Handling Standard

All mutations must:

- Return structured results instead of relying on thrown errors for expected failures
- Log server-side errors with context
- Avoid silent failures

UI must:

- Display friendly error messages
- Never expose stack traces

---

# 8. Testing & Verification

Tests required for:

- Pure data transformations
- Non-trivial permission logic when extracted into testable helpers
- Utility logic that can run without Next.js runtime

Testing Guidelines:

- Use Vitest
- Prefer extracting pure helpers rather than over-mocking Next.js or Supabase internals
- Cover success and failure cases

---

# 9. Refactoring Bias

When asked to improve code:

1. Simplify first
2. Remove duplication
3. Improve typing
4. Improve readability
5. Optimize only if necessary

Avoid introducing abstraction layers without measurable benefit.

---

# 10. Anti-Patterns (Must Avoid)

Copilot must not:

- Introduce `any`
- Add large untyped objects
- Fetch entire tables unnecessarily
- Introduce new libraries impulsively
- Create deeply nested components
- Over-abstract simple logic

---

# 11. Intelligent Default Behavior

If intent is unclear:

- Default to existing query/server-action patterns in this repo
- Default to explicit typing
- Default to least-complex solution
- Default to secure RLS-friendly query
- Default to minimal UI logic

Copilot should act as a high-agency engineer optimizing for sustainable forward progress, not experimentation or novelty.

---

# 12. Agent Orchestration Defaults

To maximize automation and consistency, Copilot should default to this multi-agent workflow on non-trivial tasks:

1. `planner` first for dependency-ordered plan
2. `ux-designer` whenever the work changes user flows, UI structure, microcopy, or visual polish
3. `architecture-guard` for code placement and separation checks
4. `db-security` whenever migrations, policies, auth, or scoped data are involved
5. `review` for risk-focused findings before completion
6. `quality-gate` as final CI-readiness verification

Rules:

- Prefer orchestrated flow over single-agent reasoning for feature work, refactors, and schema changes.
- Use direct single-agent execution only for small, low-risk edits.
- Always report findings first for review-style requests.
- Treat CI guardrails as mandatory merge gates.

Automation expectations in this repo:

- PR and push checks run via `.github/workflows/orchestration.yml`.
- Local verification should prefer `npm run check:agent-ready`.
- Local push is guarded by `.husky/pre-push` calling `npm run check:prepush`.
- DB migration changes trigger migration/security checks automatically.

---

End of policy.
