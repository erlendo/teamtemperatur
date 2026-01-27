# Database Migration Guide

## Problem: "Kunne ikke lagre utkast" error

Hvis du ser denne feilen, betyr det at `tt_drafts` tabellen ikke eksisterer i databasen ennå.

## Løsning: Kjør migrasjon i Supabase

### Metode 1: Via Supabase Dashboard (anbefalt)

1. Gå til [Supabase Dashboard](https://supabase.com/dashboard)
2. Velg prosjektet `teamtemperatur`
3. Gå til **SQL Editor**
4. Åpne filen `supabase/migrations/005_drafts_and_year_stats.sql`
5. Kopier hele SQL-innholdet
6. Lim inn i SQL Editor
7. Klikk **Run**

### Metode 2: Via Supabase CLI

```bash
# Hvis du har Supabase CLI installert
supabase db push
```

## Verifiser at migrasjonen fungerte

Kjør denne SQL-en i Supabase SQL Editor:

```sql
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'tt_drafts'
);
```

Hvis resultatet er `true`, er tabellen opprettet!

## Tabeller som skal eksistere

- `teams` (001_init.sql)
- `team_memberships` (001_init.sql)
- `questionnaires` (001_init.sql)
- `questions` (001_init.sql)
- `submissions` (001_init.sql)
- `answers` (001_init.sql)
- `tt_drafts` (005_drafts_and_year_stats.sql) ← DENNE MANGLER

## Andre migrasjoner

Hvis du oppretter databasen fra scratch, kjør alle migrasjoner i rekkefølge:

1. `001_init.sql` - Grunnleggende tabeller + RLS
2. `002_default_questionnaire.sql` - Standard spørsmål
3. `003_localize_norwegian.sql` - Norske tekster
4. `004_tt_prefix_views.sql` - Database views
5. `005_drafts_and_year_stats.sql` - Drafts + statistikk-funksjoner
