## Summary

-

## Checklist

- [ ] TypeScript types are updated first (if schema/domain changed)
- [ ] DB logic is in `services/` or `lib/supabase/` (not UI)
- [ ] Mutations are in `server/actions/`
- [ ] Queries use explicit columns (no `SELECT *`)
- [ ] Team/user scoping is enforced (`team_id` / `user_id`)
- [ ] RLS impact reviewed
- [ ] Error handling returns safe user-facing messages
- [ ] Tests added/updated for non-trivial logic

## Risk Review

- Security impact:
- Data model / migration impact:
- Possible regressions:

## Validation

- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] `npm run build`
- [ ] `npm run check:architecture`
