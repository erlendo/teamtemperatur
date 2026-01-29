-- Function to create default questionnaire for a team
create or replace function public.create_default_questionnaire(p_team_id uuid, p_created_by uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_questionnaire_id uuid;
begin
  -- Create questionnaire
  insert into public.questionnaires (team_id, name, version, is_active, created_by)
  values (p_team_id, 'Team Temperature', 1, true, p_created_by)
  returning id into v_questionnaire_id;

  -- Insert 10 scale questions
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

  -- Insert 2 yes/no questions
  insert into public.questions (questionnaire_id, key, label, type, required, weight, sort_order) values
    (v_questionnaire_id, 'learning', 'Har du lært noe nytt denne uka?', 'yes_no', true, 0, 11),
    (v_questionnaire_id, 'obstacles', 'Opplever du hindringer som gjør det vanskelig å få gjort jobben din?', 'yes_no', true, 0, 12);

  return v_questionnaire_id;
end;
$$;

grant execute on function public.create_default_questionnaire(uuid, uuid) to authenticated;
