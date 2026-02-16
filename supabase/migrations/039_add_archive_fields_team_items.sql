BEGIN;

ALTER TABLE public.team_items
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid references auth.users(id) on delete set null;

CREATE INDEX IF NOT EXISTS team_items_archived_at_idx
  ON public.team_items(archived_at);

CREATE INDEX IF NOT EXISTS team_items_team_id_archived_at_idx
  ON public.team_items(team_id, archived_at);

COMMIT;
