
-- V2.8 diagnostics (read-only except one clearly named test lead).
select current_database() as database_name;
select to_regprocedure(
 'public.submit_public_lead(text,text,text,text,text,text,text,text,text)'
) as public_lead_rpc;

select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='leads'
order by policyname;

-- Optional direct RPC test from SQL Editor:
-- select public.submit_public_lead(
--   'V2.8 TEST','02000000000',null,'Lao Web Studio Test',
--   'website','500000','Migration verification test',
--   'whatsapp','lo'
-- );
