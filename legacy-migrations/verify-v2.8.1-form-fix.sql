select
  a.atttypid::regtype::text as leads_id_type,
  to_regprocedure('public.submit_public_lead(text,text,text,text,text,text,text,text,text)') as rpc,
  has_function_privilege('anon','public.submit_public_lead(text,text,text,text,text,text,text,text,text)','EXECUTE') as anon_can_execute
from pg_attribute a
join pg_class c on c.oid=a.attrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='leads' and a.attname='id' and a.attnum>0;
