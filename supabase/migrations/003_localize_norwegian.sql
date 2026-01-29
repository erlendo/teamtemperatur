-- Lokaliser standard spørreskjema og statistikk til norsk bokmål

-- Oppdater eksisterende skjema-navn til norsk
update public.questionnaires
set name = 'Teamtemperatur'
where name = 'Team Temperature';

-- Oppdater etiketter for kjente spørsmål (skaler)
update public.questions set label = 'Hvor bra har du det på jobb denne uka?' where key = 'feeling';
update public.questions set label = 'Hvor motivert føler du deg i arbeidet ditt?' where key = 'motivation';
update public.questions set label = 'Hvor godt opplever du at arbeidsmengden din er tilpasset?' where key = 'workload';
update public.questions set label = 'Hvor håndterbart opplever du stressnivået ditt?' where key = 'stress';
update public.questions set label = 'Hvor tydelige opplever du målene du jobber mot?' where key = 'clarity';
update public.questions set label = 'Hvor klare opplever du forventningene til deg?' where key = 'expectations';
update public.questions set label = 'Hvor godt opplever du at samarbeidet fungerer for deg i teamet?' where key = 'collaboration';
update public.questions set label = 'Hvor godt opplever du at kommunikasjonen fungerer i teamet?' where key = 'communication';
update public.questions set label = 'I hvilken grad opplever du at du får nyttige tilbakemeldinger?' where key = 'feedback';
update public.questions set label = 'I hvilken grad opplever du at arbeidet ditt blir verdsatt?' where key = 'recognition';

-- Oppdater etiketter for ja/nei-spørsmål
update public.questions set label = 'Har du lært noe nytt denne uka?' where key = 'learning';
update public.questions set label = 'Opplever du hindringer som gjør det vanskelig å få gjort jobben din?' where key = 'obstacles';

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
    (v_questionnaire_id, 'feeling', 'Hvor bra har du det på jobb denne uka?', 'scale_1_5', true, 1, 1),
    (v_questionnaire_id, 'motivation', 'Hvor motivert føler du deg i arbeidet ditt?', 'scale_1_5', true, 1, 2),
    (v_questionnaire_id, 'workload', 'Hvor godt opplever du at arbeidsmengden din er tilpasset?', 'scale_1_5', true, 1, 3),
    (v_questionnaire_id, 'stress', 'Hvor håndterbart opplever du stressnivået ditt?', 'scale_1_5', true, 1, 4),
    (v_questionnaire_id, 'clarity', 'Hvor tydelige opplever du målene du jobber mot?', 'scale_1_5', true, 1, 5),
    (v_questionnaire_id, 'expectations', 'Hvor klare opplever du forventningene til deg?', 'scale_1_5', true, 1, 6),
    (v_questionnaire_id, 'collaboration', 'Hvor godt opplever du at samarbeidet fungerer for deg i teamet?', 'scale_1_5', true, 1, 7),
    (v_questionnaire_id, 'communication', 'Hvor godt opplever du at kommunikasjonen fungerer i teamet?', 'scale_1_5', true, 1, 8),
    (v_questionnaire_id, 'feedback', 'I hvilken grad opplever du at du får nyttige tilbakemeldinger?', 'scale_1_5', true, 1, 9),
    (v_questionnaire_id, 'recognition', 'I hvilken grad opplever du at arbeidet ditt blir verdsatt?', 'scale_1_5', true, 1, 10);

  insert into public.questions (questionnaire_id, key, label, type, required, weight, sort_order) values
    (v_questionnaire_id, 'learning', 'Har du lært noe nytt denne uka?', 'yes_no', true, 0, 11),
    (v_questionnaire_id, 'obstacles', 'Opplever du hindringer som gjør det vanskelig å få gjort jobben din?', 'yes_no', true, 0, 12);

  return v_questionnaire_id;
end;
$$;

grant execute on function public.create_default_questionnaire(uuid, uuid) to authenticated;

-- Replacer stats-RPC til å returnere label og sortering
DROP FUNCTION IF EXISTS public.get_team_week_stats(uuid, int);
create function public.get_team_week_stats(p_team_id uuid, p_week int)
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
