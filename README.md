# Team Temperature (Next.js + Supabase + Vercel)

## Kom i gang (lokalt)
1. Kopier `.env.example` til `.env.local` og fyll inn:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Installer og kjør:
```bash
npm install
npm run dev
```

## Supabase
Kjør SQL i `supabase/migrations/001_init.sql` i Supabase SQL Editor.

**Viktig:** Appen forventer at hvert team har minst ett aktivt spørreskjema (`questionnaires`) med tilhørende `questions`.

MVP-en her oppretter team + owner membership, men oppretter ikke default spørsmål automatisk.
(Det kan vi legge til neste, sammen med admin UI for spørsmål/invites.)

## Deploy til Vercel
- Import repo
- Sett env vars i Vercel (Project Settings -> Environment Variables)
- Deploy
