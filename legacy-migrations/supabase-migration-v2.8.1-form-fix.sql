-- Lao Web Studio V2.8.1 Public Form Fix
-- Run this entire file in Supabase SQL Editor.
-- Safe for both legacy bigint lead IDs and newer uuid lead IDs.

create extension if not exists pgcrypto;

alter table public.leads
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists business_name text,
  add column if not exists service text default 'website',
  add column if not exists budget text,
  add column if not exists message text,
  add column if not exists preferred_contact text default 'whatsapp',
  add column if not exists language text default 'lo',
  add column if not exists status text default 'new',
  add column if not exists source text default 'website',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Remove the old UUID-returning function before changing its return type.
drop function if exists public.submit_public_lead(text,text,text,text,text,text,text,text,text);

create function public.submit_public_lead(
  p_name text,
  p_phone text,
  p_email text default null,
  p_business_name text default null,
  p_service text default 'website',
  p_budget text default null,
  p_message text default '',
  p_preferred_contact text default 'whatsapp',
  p_language text default 'lo'
)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  new_id text;
begin
  if nullif(btrim(p_name),'') is null then raise exception 'name_required'; end if;
  if nullif(btrim(p_phone),'') is null then raise exception 'phone_required'; end if;
  if nullif(btrim(p_message),'') is null then raise exception 'message_required'; end if;

  insert into public.leads(
    name,phone,email,business_name,service,budget,message,
    preferred_contact,language,status,source,created_at,updated_at
  ) values (
    left(btrim(p_name),200),
    left(btrim(p_phone),80),
    nullif(left(btrim(coalesce(p_email,'')),320),''),
    nullif(left(btrim(coalesce(p_business_name,'')),250),''),
    left(coalesce(nullif(btrim(p_service),''),'website'),100),
    nullif(left(btrim(coalesce(p_budget,'')),100),''),
    left(btrim(p_message),5000),
    left(coalesce(nullif(btrim(p_preferred_contact),''),'whatsapp'),50),
    case when p_language in ('lo','th','en') then p_language else 'lo' end,
    'new','website',now(),now()
  ) returning id::text into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_public_lead(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.submit_public_lead(text,text,text,text,text,text,text,text,text) to anon,authenticated;

-- Fallback insert permissions: only approved public-form columns.
alter table public.leads enable row level security;
revoke all on table public.leads from anon;
grant insert (name,phone,email,business_name,service,budget,message,preferred_contact,language,status,source)
  on public.leads to anon;

-- Remove all previous INSERT policies, including restrictive legacy policies.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname='public' and tablename='leads' and cmd='INSERT'
  loop
    execute format('drop policy if exists %I on public.leads',p.policyname);
  end loop;
end $$;

create policy "v281_public_insert_leads"
on public.leads
as permissive
for insert
to anon
with check (
  status='new'
  and source='website'
  and nullif(btrim(name),'') is not null
  and nullif(btrim(phone),'') is not null
  and nullif(btrim(message),'') is not null
);

-- Keep authenticated staff insert access.
drop policy if exists "v281_staff_insert_leads" on public.leads;
create policy "v281_staff_insert_leads"
on public.leads
as permissive
for insert
to authenticated
with check (public.is_staff());

-- Force PostgREST to discover the new function immediately.
notify pgrst, 'reload schema';

select
  'V2.8.1 installed' as result,
  pg_typeof(id)::text as leads_id_type,
  to_regprocedure('public.submit_public_lead(text,text,text,text,text,text,text,text,text)') is not null as rpc_ready
from public.leads
limit 1;
