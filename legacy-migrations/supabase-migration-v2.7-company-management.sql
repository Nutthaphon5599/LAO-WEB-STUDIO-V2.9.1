
-- Lao Web Studio V2.7 Company Management
-- Run after V2.6.1. Safe migration: no existing CRM data is deleted.

create extension if not exists pgcrypto;

-- Profiles connect Supabase Authentication users to business roles.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'staff'
    check (role in ('owner','manager','staff','customer')),
  lead_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  lead_id text,
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  project_name text,
  description text,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  currency text not null default 'ກີບ',
  status text not null default 'draft'
    check (status in ('draft','sent','partially_paid','paid','overdue','cancelled')),
  issue_date date not null default current_date,
  due_date date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'ກີບ',
  payment_method text default 'bank_transfer',
  payment_date date not null default current_date,
  reference text,
  note text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  customer_user_id uuid references auth.users(id) on delete cascade,
  project_name text not null,
  title text not null,
  message text,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'in_progress'
    check (status in ('planning','in_progress','review','completed','on_hold')),
  is_visible_to_customer boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Expand tasks for Kanban and customer linkage.
alter table if exists public.tasks
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_invoices_customer on public.invoices(customer_user_id, created_at desc);
create index if not exists idx_invoices_status on public.invoices(status, due_date);
create index if not exists idx_payments_invoice on public.payments(invoice_id, payment_date desc);
create index if not exists idx_updates_customer on public.project_updates(customer_user_id, created_at desc);
create index if not exists idx_tasks_kanban on public.tasks(status, sort_order);

-- Automatically create a basic profile after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role','customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper functions used by RLS.
create or replace function public.current_role()
returns text language sql stable security definer set search_path=public
as $$ select coalesce((select role from public.profiles where id=auth.uid()),'customer'); $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public
as $$ select public.current_role() in ('owner','manager','staff'); $$;

alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.project_updates enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select to authenticated
using (id=auth.uid() or public.is_staff());

drop policy if exists "profiles_staff_write" on public.profiles;
create policy "profiles_staff_write" on public.profiles for all to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));

drop policy if exists "invoices_read" on public.invoices;
create policy "invoices_read" on public.invoices for select to authenticated
using (public.is_staff() or customer_user_id=auth.uid());

drop policy if exists "invoices_staff_write" on public.invoices;
create policy "invoices_staff_write" on public.invoices for all to authenticated
using (public.is_staff()) with check (public.is_staff());

drop policy if exists "payments_read" on public.payments;
create policy "payments_read" on public.payments for select to authenticated
using (
  public.is_staff() or exists(
    select 1 from public.invoices i
    where i.id=payments.invoice_id and i.customer_user_id=auth.uid()
  )
);

drop policy if exists "payments_staff_write" on public.payments;
create policy "payments_staff_write" on public.payments for all to authenticated
using (public.is_staff()) with check (public.is_staff());

drop policy if exists "updates_read" on public.project_updates;
create policy "updates_read" on public.project_updates for select to authenticated
using (public.is_staff() or (customer_user_id=auth.uid() and is_visible_to_customer=true));

drop policy if exists "updates_staff_write" on public.project_updates;
create policy "updates_staff_write" on public.project_updates for all to authenticated
using (public.is_staff()) with check (public.is_staff());

-- Replace broad V2.6 authenticated tasks policy with role/customer-aware access.
drop policy if exists "authenticated_all_tasks" on public.tasks;
drop policy if exists "tasks_read_v27" on public.tasks;
create policy "tasks_read_v27" on public.tasks for select to authenticated
using (public.is_staff() or customer_user_id=auth.uid());

drop policy if exists "tasks_staff_write_v27" on public.tasks;
create policy "tasks_staff_write_v27" on public.tasks for all to authenticated
using (public.is_staff()) with check (public.is_staff());

-- Invoice totals and payment status.
create or replace function public.refresh_invoice_payment_status(p_invoice_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare paid_total numeric(14,2); inv_total numeric(14,2);
begin
  select total into inv_total from public.invoices where id=p_invoice_id;
  select coalesce(sum(amount),0) into paid_total from public.payments where invoice_id=p_invoice_id;
  update public.invoices set
    status = case
      when paid_total >= inv_total and inv_total > 0 then 'paid'
      when paid_total > 0 then 'partially_paid'
      when due_date < current_date and status not in ('cancelled','paid') then 'overdue'
      else status
    end,
    updated_at=now()
  where id=p_invoice_id;
end $$;

create or replace function public.payment_status_trigger()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  perform public.refresh_invoice_payment_status(coalesce(new.invoice_id,old.invoice_id));
  return coalesce(new,old);
end $$;

drop trigger if exists payments_refresh_invoice on public.payments;
create trigger payments_refresh_invoice
after insert or update or delete on public.payments
for each row execute function public.payment_status_trigger();

-- Realtime tables.
do $$
begin alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null; end $$;
do $$
begin alter publication supabase_realtime add table public.invoices;
exception when duplicate_object then null; end $$;
do $$
begin alter publication supabase_realtime add table public.payments;
exception when duplicate_object then null; end $$;
do $$
begin alter publication supabase_realtime add table public.project_updates;
exception when duplicate_object then null; end $$;

-- IMPORTANT:
-- After creating your first owner in Supabase Authentication, run:
-- update public.profiles set role='owner', full_name='Nutthaphon'
-- where email='YOUR_OWNER_EMAIL';
