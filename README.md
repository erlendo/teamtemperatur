# Team Temperature (Next.js + Supabase + Vercel)

## Kom i gang (lokalt)

1. Kopier `.env.example` til `.env.local` og fyll inn:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ved server-side admin/migration-behov

2. Installer og kjør:

```bash
npm install
npm run dev
```

## Verifisering

Bruk disse kommandoene før push eller når en agent har gjort endringer:

```bash
npm run test:run
npm run check:agent-ready
```

`check:agent-ready` kjører lint, typecheck, tester, arkitekturguard og build i riktig rekkefølge.

## Supabase

Kjør SQL i `supabase/migrations/001_init.sql` i Supabase SQL Editor.

**Viktig:** Appen forventer at hvert team har minst ett aktivt spørreskjema (`questionnaires`) med tilhørende `questions`.

MVP-en her oppretter team + owner membership, men oppretter ikke default spørsmål automatisk.
(Det kan vi legge til neste, sammen med admin UI for spørsmål/invites.)

## Deploy til Vercel

- Import repo
- Sett env vars i Vercel (Project Settings -> Environment Variables)
- Deploy

## Agentarbeidsflyt

- Les [AGENTS.md](/Users/erlendo/Teamtemperatur/AGENTS.md) for repo-spesifikke regler og domene.
- Bruk `server/actions/` for mutasjoner og server-side datalogikk i tråd med eksisterende repo.
- Ikke legg Supabase-kall i UI-komponenter.
- Trekk ut ren logikk til små helpers når den trenger tester.
- Bruk UX-agenten for arbeid som påvirker flyt, mikrotekst, layout, tilgjengelighet eller visuell finish.
