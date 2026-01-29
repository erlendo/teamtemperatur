-- Reset app data (keep auth.users intact)
-- WARNING: Irreversible. Deletes all teams, memberships, questionnaires, questions, submissions, answers, drafts.

TRUNCATE TABLE
  public.answers,
  public.submissions,
  public.questions,
  public.questionnaires,
  public.team_memberships,
  public.teams,
  public.tt_drafts
RESTART IDENTITY CASCADE;
