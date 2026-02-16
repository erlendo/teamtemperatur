# Team Temperature – Copilot Policy (Extreme Velocity Mode)

This is a behavioral control document for GitHub Copilot.
It defines how Copilot must think when generating code in this repository.

Primary objective: Maximum forward velocity without architectural debt.

Copilot must behave like a pragmatic senior engineer optimizing for sustainable speed.

Environment:

- Single environment only: production on Vercel + Supabase.
- No local or staging environments.

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
2. Implement service-layer DB logic
3. Add server action (if mutation)
4. Connect UI
5. Add error handling
6. Add test (if logic is non-trivial)

Never start with UI-first when backend logic is required.

---

# 3. Architecture Discipline

Hard rules:

- No direct Supabase calls inside UI components.
- All DB logic must live in `lib/supabase/` or `services/`.
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
  const { data, error } = await supabaseServer.from('teams').select('id, name')

  if (error) throw new Error(error.message)
  return data
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
- Use Tailwind consistently
- Use lucide-react icons only
- Use `useTransition()` for async interactions

Do not:

- Mix database logic in UI
- Introduce heavy global state
- Over-engineer animations

Favor:

- Predictable layout
- Reusable card patterns
- Composition over inheritance

---

# 7. Error Handling Standard

All mutations must:

- Throw explicit `Error`
- Return structured responses when needed
- Avoid silent failures

UI must:

- Display friendly error messages
- Never expose stack traces

---

# 8. Testing & Verification

Tests required for:

- Service-layer logic
- Permission logic
- Data transformations

Testing Guidelines:

- Use Vitest
- Mock Supabase clients
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

- Default to service + server action pattern
- Default to explicit typing
- Default to least-complex solution
- Default to secure RLS-friendly query
- Default to minimal UI logic

Copilot should act as a high-agency engineer optimizing for sustainable forward progress, not experimentation or novelty.

---

End of policy.
