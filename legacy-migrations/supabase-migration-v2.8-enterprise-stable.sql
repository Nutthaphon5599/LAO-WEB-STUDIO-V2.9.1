
-- ============================================================
-- Lao Web Studio V2.8 Enterprise Stable
-- Run once in Supabase SQL Editor after V2.7.x.
-- Safe to run repeatedly. No existing CRM records are deleted.
-- ============================================================

create extension if not exists pgcrypto;

-- Ensure all columns expected by the public form exist.
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

-- Normalize missing defaults without changing existing rows.
alter table public.leads alter column service set default 'website';
alter table public.leads alter column preferred_contact set default 'whatsapp';
alter table public.leads alter column language set default 'lo';
alter table public.leads alter column status set default 'new';
alter table public.leads alter column source set default 'website';
alter table public.leads alter column created_at set default now();
alter table public.leads alter column updated_at set default now();

create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_status_idx on public.leads(status);

-- Role helpers used by RLS.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(
    (select role from public.profiles where id=auth.uid() and is_active=true),
    'customer'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.current_role() in ('owner','manager','staff');
$$;

-- Secure public lead-submission endpoint.
-- Visitors can submit only the approved fields. Status and source are forced by the server.
create or replace function public.submit_public_lead(
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
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  new_id uuid;
begin
  if nullif(btrim(p_name),'') is null then
    raise exception 'name_required';
  end if;
  if nullif(btrim(p_phone),'') is null then
    raise exception 'phone_required';
  end if;
  if nullif(btrim(p_message),'') is null then
    raise exception 'message_required';
  end if;

  insert into public.leads(
    name,phone,email,business_name,service,budget,message,
    preferred_contact,language,status,source,created_at,updated_at
  )
  values(
    left(btrim(p_name),200),
    left(btrim(p_phone),80),
    nullif(left(btrim(coalesce(p_email,'')),320),''),
    nullif(left(btrim(coalesce(p_business_name,'')),250),''),
    left(coalesce(nullif(btrim(p_service),''),'website'),100),
    nullif(left(btrim(coalesce(p_budget,'')),100),''),
    left(btrim(p_message),5000),
    left(coalesce(nullif(btrim(p_preferred_contact),''),'whatsapp'),50),
    case when p_language in ('lo','th','en') then p_language else 'lo' end,
    'new',
    'website',
    now(),
    now()
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_public_lead(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.submit_public_lead(text,text,text,text,text,text,text,text,text)
to anon, authenticated;

-- Public users must not query CRM leads directly.
alter table public.leads enable row level security;
revoke all on table public.leads from anon;
grant select,insert,update,delete on table public.leads to authenticated;

-- Remove every legacy leads policy, including restrictive policies from prior versions.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname='public' and tablename='leads'
  loop
    execute format('drop policy if exists %I on public.leads',p.policyname);
  end loop;
end $$;

create policy "v28_staff_read_leads"
on public.leads for select to authenticated
using (public.is_staff());

create policy "v28_staff_insert_leads"
on public.leads for insert to authenticated
with check (public.is_staff());

create policy "v28_staff_update_leads"
on public.leads for update to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "v28_staff_delete_leads"
on public.leads for delete to authenticated
using (public.is_staff());

-- Preserve public website reads.
alter table if exists public.projects enable row level security;
drop policy if exists "v28_public_read_projects" on public.projects;
create policy "v28_public_read_projects"
on public.projects for select to anon,authenticated using (true);

alter table if exists public.pricing enable row level security;
drop policy if exists "v28_public_read_pricing" on public.pricing;
create policy "v28_public_read_pricing"
on public.pricing for select to anon,authenticated using (true);

alter table if exists public.services enable row level security;
drop policy if exists "v28_public_read_services" on public.services;
create policy "v28_public_read_services"
on public.services for select to anon,authenticated
using (coalesce(is_active,true)=true or public.is_staff());

alter table if exists public.company_settings enable row level security;
drop policy if exists "v28_public_read_company_settings" on public.company_settings;
create policy "v28_public_read_company_settings"
on public.company_settings for select to anon,authenticated using (true);

-- Staff writes for public-content tables.
drop policy if exists "v28_staff_write_projects" on public.projects;
create policy "v28_staff_write_projects"
on public.projects for all to authenticated
using (public.is_staff()) with check (public.is_staff());

drop policy if exists "v28_staff_write_pricing" on public.pricing;
create policy "v28_staff_write_pricing"
on public.pricing for all to authenticated
using (public.is_staff()) with check (public.is_staff());

drop policy if exists "v28_staff_write_services" on public.services;
create policy "v28_staff_write_services"
on public.services for all to authenticated
using (public.is_staff()) with check (public.is_staff());

drop policy if exists "v28_staff_write_company_settings" on public.company_settings;
create policy "v28_staff_write_company_settings"
on public.company_settings for all to authenticated
using (public.is_staff()) with check (public.is_staff());

-- Verification output.
select
  'V2.8 installed' as result,
  to_regprocedure('public.submit_public_lead(text,text,text,text,text,text,text,text,text)') is not null as rpc_ready,
  exists(
    select 1 from pg_policies
    where schemaname='public'
      and tablename='leads'
      and policyname='v28_staff_read_leads'
  ) as staff_policy_ready;
