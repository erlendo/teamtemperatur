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

  -- Insert 2 yes/no questions
  insert into public.questions (questionnaire_id, key, label, type, required, weight, sort_order) values
    (v_questionnaire_id, 'learning', 'Lærer du noe nytt denne uken?', 'yes_no', true, 0, 11),
    (v_questionnaire_id, 'obstacles', 'Er det hindringer som blokkerer deg?', 'yes_no', true, 0, 12);

  return v_questionnaire_id;
end;
$$;

grant execute on function public.create_default_questionnaire(uuid, uuid) to authenticated;
