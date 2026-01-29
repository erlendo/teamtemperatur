-- Disable RLS on questions table, update labels, then re-enable RLS
-- This is necessary because RLS policies prevent even superusers from UPDATE
-- if the with check clause fails (no authenticated user context in migrations)

ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;

UPDATE public.questions SET label = 'Hvor bra har du det på jobb denne uka?' WHERE key = 'feeling';
UPDATE public.questions SET label = 'Hvor motivert føler du deg i arbeidet ditt?' WHERE key = 'motivation';
UPDATE public.questions SET label = 'Hvor håndterbar opplever du arbeidsmengden din?' WHERE key = 'workload';
UPDATE public.questions SET label = 'Hvor godt opplever du stressnivået ditt?' WHERE key = 'stress';
UPDATE public.questions SET label = 'Hvor tydelige opplever du målene du jobber mot?' WHERE key = 'clarity';
UPDATE public.questions SET label = 'Hvor klare opplever du forventningene til deg?' WHERE key = 'expectations';
UPDATE public.questions SET label = 'Hvor godt fungerer samarbeidet for deg i teamet?' WHERE key = 'collaboration';
UPDATE public.questions SET label = 'Hvor godt opplever du kommunikasjonen i teamet?' WHERE key = 'communication';
UPDATE public.questions SET label = 'I hvilken grad opplever du at du får tilstrekkelige tilbakemeldinger?' WHERE key = 'feedback';
UPDATE public.questions SET label = 'I hvilken grad føler du deg verdsatt for jobben du gjør?' WHERE key = 'recognition';
UPDATE public.questions SET label = 'Har du lært noe nytt denne uka?' WHERE key = 'learning';
UPDATE public.questions SET label = 'Opplever du hindringer som gjør det vanskelig å få gjort jobben din?' WHERE key = 'obstacles';

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
