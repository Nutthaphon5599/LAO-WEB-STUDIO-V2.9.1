-- Lao Web Studio V2.4 CRM Pro migration (repeat-safe, preserves existing data)
create extension if not exists pgcrypto;

-- Upgrade existing leads table without deleting old records.
alter table public.leads add column if not exists name text;
alter table public.leads add column if not exists owner_id uuid;
alter table public.leads add column if not exists priority text default 'medium';
alter table public.leads add column if not exists next_follow_up date;
alter table public.leads add column if not exists admin_note text;
alter table public.leads add column if not exists lead_code text;
alter table public.leads add column if not exists source text default 'website';
alter table public.leads add column if not exists language text default 'lo';
alter table public.leads add column if not exists preferred_contact text default 'whatsapp';
alter table public.leads add column if not exists service text default 'website';
alter table public.leads add column if not exists updated_at timestamptz default now();

-- Support the older full_name schema.
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='leads' and column_name='full_name') then
   execute 'update public.leads set name=full_name where name is null';
 end if;
end $$;

-- Replace old status check constraint with V2.4 workflow.
do $$ declare r record; begin
 for r in select conname from pg_constraint where conrelid='public.leads'::regclass and contype='c' loop
   if pg_get_constraintdef(r.oid) ilike '%status%' then execute format('alter table public.leads drop constraint %I',r.conname); end if;
 end loop;
end $$;
alter table public.leads add constraint leads_status_v24_check check(status in ('new','contacted','quotation_sent','in_progress','waiting','completed','cancelled')) not valid;

create table if not exists public.employees(
 id uuid primary key default gen_random_uuid(), name text not null, email text, phone text,
 role text not null default 'owner', active boolean not null default true, created_at timestamptz not null default now()
);
insert into public.employees(name,email,role) select 'Nutthaphon',null,'owner'
where not exists(select 1 from public.employees where lower(name)='nutthaphon');

create table if not exists public.quotations(
 id uuid primary key default gen_random_uuid(), quote_no text unique not null, lead_id text,
 customer_name text not null, customer_email text, service text, amount numeric not null default 0,
 currency text not null default 'ກີບ', valid_until date, status text not null default 'draft',
 created_by text not null default 'Nutthaphon', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.employees enable row level security;
alter table public.quotations enable row level security;
drop policy if exists "Admins manage employees" on public.employees;
create policy "Admins manage employees" on public.employees for all to authenticated using(true) with check(true);
drop policy if exists "Admins manage quotations" on public.quotations;
create policy "Admins manage quotations" on public.quotations for all to authenticated using(true) with check(true);

-- Keep the existing authenticated admin policies for leads, and reload API schema.
notify pgrst,'reload schema';
select table_name from information_schema.tables where table_schema='public' and table_name in ('leads','employees','quotations') order by table_name;
