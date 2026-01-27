-- Lokaliser standard spørreskjema og statistikk til norsk bokmål

-- Oppdater eksisterende skjema-navn til norsk
update public.questionnaires
set name = 'Teamtemperatur'
where name = 'Team Temperature';

-- Oppdater etiketter for kjente spørsmål (skaler)
update public.questions set label = 'Hvordan føler du deg?' where key = 'feeling';
update public.questions set label = 'Hvor motivert er du?' where key = 'motivation';
update public.questions set label = 'Hvordan opplever du arbeidsmengden?' where key = 'workload';
update public.questions set label = 'Hvor stresset føler du deg?' where key = 'stress';
update public.questions set label = 'Hvor tydelige er målene?' where key = 'clarity';
update public.questions set label = 'Er forventningene klare?' where key = 'expectations';
update public.questions set label = 'Hvordan fungerer samarbeidet?' where key = 'collaboration';
update public.questions set label = 'Hvordan er kommunikasjonen?' where key = 'communication';
update public.questions set label = 'Får du nok tilbakemeldinger?' where key = 'feedback';
update public.questions set label = 'Føler du deg verdsatt?' where key = 'recognition';

-- Oppdater etiketter for ja/nei-spørsmål
update public.questions set label = 'Lærer du noe nytt denne uken?' where key = 'learning';
update public.questions set label = 'Er det hindringer som blokkerer deg?' where key = 'obstacles';

-- Replacer standard-opprettelse av spørreskjema med norsk navn
create or replace function public.create_default_questionnaire(p_team_id uuid, p_created_by uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_questionnaire_id uuid;
begin
  insert into public.questionnaires (team_id, name, version, is_active, created_by)
  values (p_team_id, 'Teamtemperatur', 1, true, p_created_by)
  returning id into v_questionnaire_id;

  insert into public.questions (questionnaire_id, key, label, type, required, weight, sort_order) values
    (v_questionnaire_id, 'feeling', 'Hvordan føler du deg?', 'scale_1_5', true, 1, 1),
    (v_questionnaire_id, 'motivation', 'Hvor motivert er du?', 'scale_1_5', true, 1, 2),
    (v_questionnaire_id, 'workload', 'Hvordan opplever du arbeidsmengden?', 'scale_1_5', true, 1, 3),
    (v_questionnaire_id, 'stress', 'Hvor stresset føler du deg?', 'scale_1_5', true, 1, 4),
    (v_questionnaire_id, 'clarity', 'Hvor tydelige er målene?', 'scale_1_5', true, 1, 5),
    (v_questionnaire_id, 'expectations', 'Er forventningene klare?', 'scale_1_5', true, 1, 6),
    (v_questionnaire_id, 'collaboration', 'Hvordan fungerer samarbeidet?', 'scale_1_5', true, 1, 7),
    (v_questionnaire_id, 'communication', 'Hvordan er kommunikasjonen?', 'scale_1_5', true, 1, 8),
    (v_questionnaire_id, 'feedback', 'Får du nok tilbakemeldinger?', 'scale_1_5', true, 1, 9),
    (v_questionnaire_id, 'recognition', 'Føler du deg verdsatt?', 'scale_1_5', true, 1, 10);

  insert into public.questions (questionnaire_id, key, label, type, required, weight, sort_order) values
    (v_questionnaire_id, 'learning', 'Lærer du noe nytt denne uken?', 'yes_no', true, 0, 11),
    (v_questionnaire_id, 'obstacles', 'Er det hindringer som blokkerer deg?', 'yes_no', true, 0, 12);

  return v_questionnaire_id;
end;
$$;

grant execute on function public.create_default_questionnaire(uuid, uuid) to authenticated;

-- Replacer stats-RPC til å returnere label og sortering
create or replace function public.get_team_week_stats(p_team_id uuid, p_week int)
returns table (
  question_key text,
  question_label text,
  sort_order int,
  avg_score numeric,
  n_answers int
)
language sql
security definer
as $$
  select
    qu.key as question_key,
    qu.label as question_label,
    coalesce(qu.sort_order, 0) as sort_order,
    avg(a.value_num) as avg_score,
    count(*) as n_answers
  from public.submissions s
  join public.answers a on a.submission_id = s.id
  join public.questions qu on qu.id = a.question_id
  where s.team_id = p_team_id
    and s.week = p_week
    and public.is_team_member(p_team_id)
    and qu.type = 'scale_1_5'
  group by qu.key, qu.label, qu.sort_order
  order by sort_order, qu.key;
$$;

revoke all on function public.get_team_week_stats(uuid,int) from public;
grant execute on function public.get_team_week_stats(uuid,int) to authenticated;
