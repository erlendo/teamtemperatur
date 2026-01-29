-- Force update NOKUT team's questionnaire with new question labels
-- This ensures the labels are updated regardless of when the team was created

UPDATE public.questions
SET label = 'Hvor bra har du det på jobb denne uka?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'feeling';

UPDATE public.questions
SET label = 'Hvor motivert føler du deg i arbeidet ditt?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'motivation';

UPDATE public.questions
SET label = 'Hvor håndterbar opplever du arbeidsmengden din?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'workload';

UPDATE public.questions
SET label = 'Hvor godt opplever du stressnivået ditt?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'stress';

UPDATE public.questions
SET label = 'Hvor tydelige opplever du målene du jobber mot?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'clarity';

UPDATE public.questions
SET label = 'Hvor klare opplever du forventningene til deg?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'expectations';

UPDATE public.questions
SET label = 'Hvor godt fungerer samarbeidet for deg i teamet?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'collaboration';

UPDATE public.questions
SET label = 'Hvor godt opplever du kommunikasjonen i teamet?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'communication';

UPDATE public.questions
SET label = 'I hvilken grad opplever du at du får tilstrekkelige tilbakemeldinger?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'feedback';

UPDATE public.questions
SET label = 'I hvilken grad føler du deg verdsatt for jobben du gjør?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'recognition';

UPDATE public.questions
SET label = 'Har du lært noe nytt denne uka?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'learning';

UPDATE public.questions
SET label = 'Opplever du hindringer som gjør det vanskelig å få gjort jobben din?'
WHERE questionnaire_id IN (
  SELECT id FROM public.questionnaires 
  WHERE team_id = '8ae767f5-4027-437e-ae75-d34b3769544c'
)
AND key = 'obstacles';
