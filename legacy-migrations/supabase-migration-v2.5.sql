-- Lao Web Studio V2.5 Business CRM migration
-- Repeat-safe. Preserves all existing V2.4 data.
create extension if not exists pgcrypto;

alter table public.employees add column if not exists auth_user_id uuid;
alter table public.employees add column if not exists job_title text;
alter table public.employees add column if not exists updated_at timestamptz not null default now();

create table if not exists public.appointments(
 id uuid primary key default gen_random_uuid(),
 lead_id text,
 title text not null,
 appointment_at timestamptz not null,
 channel text not null default 'whatsapp' check(channel in ('whatsapp','email','phone','online','onsite')),
 note text,
 status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
 owner_name text not null default 'Nutthaphon',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.client_files(
 id uuid primary key default gen_random_uuid(),
 lead_id text not null,
 file_name text not null,
 file_path text not null,
 file_type text,
 file_size bigint,
 uploaded_by text not null default 'Nutthaphon',
 created_at timestamptz not null default now()
);

alter table public.quotations add column if not exists description text;
alter table public.quotations add column if not exists tax_percent numeric not null default 0;
alter table public.quotations add column if not exists discount numeric not null default 0;
alter table public.quotations add column if not exists payment_terms text default '50% deposit, 50% on completion';
alter table public.quotations add column if not exists notes text;

create index if not exists appointments_date_idx on public.appointments(appointment_at);
create index if not exists client_files_lead_idx on public.client_files(lead_id);

alter table public.appointments enable row level security;
alter table public.client_files enable row level security;
drop policy if exists "Admins manage appointments" on public.appointments;
create policy "Admins manage appointments" on public.appointments for all to authenticated using(true) with check(true);
drop policy if exists "Admins manage client files" on public.client_files;
create policy "Admins manage client files" on public.client_files for all to authenticated using(true) with check(true);

insert into storage.buckets(id,name,public) values ('client-files','client-files',false)
on conflict(id) do update set public=false;
drop policy if exists "Admins manage client file objects" on storage.objects;
create policy "Admins manage client file objects" on storage.objects for all to authenticated using(bucket_id='client-files') with check(bucket_id='client-files');

notify pgrst,'reload schema';
select table_name from information_schema.tables
where table_schema='public' and table_name in ('employees','leads','quotations','appointments','client_files')
order by table_name;
