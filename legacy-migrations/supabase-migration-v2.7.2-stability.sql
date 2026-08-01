
-- Lao Web Studio V2.7.2 Stability Update
-- Run after V2.7 / V2.7.1.
-- This migration fixes public lead submission and tightens staff/customer access.
-- It does not delete existing data.

-- Helper functions may already exist from V2.7.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'customer'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('owner','manager','staff');
$$;

-- LEADS
-- Public visitors may submit a quotation request.
alter table public.leads enable row level security;

drop policy if exists "public_insert_leads" on public.leads;
create policy "public_insert_leads"
on public.leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "staff_read_leads" on public.leads;
create policy "staff_read_leads"
on public.leads
for select
to authenticated
using (public.is_staff());

drop policy if exists "staff_update_leads" on public.leads;
create policy "staff_update_leads"
on public.leads
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "staff_delete_leads" on public.leads;
create policy "staff_delete_leads"
on public.leads
for delete
to authenticated
using (public.is_staff());

-- APPOINTMENTS
alter table if exists public.appointments enable row level security;
drop policy if exists "staff_all_appointments_v272" on public.appointments;
create policy "staff_all_appointments_v272"
on public.appointments
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- QUOTATIONS
alter table if exists public.quotations enable row level security;
drop policy if exists "staff_all_quotations_v272" on public.quotations;
create policy "staff_all_quotations_v272"
on public.quotations
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- CLIENT FILES
alter table if exists public.client_files enable row level security;
drop policy if exists "staff_all_client_files_v272" on public.client_files;
create policy "staff_all_client_files_v272"
on public.client_files
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- PROJECTS / PORTFOLIO
alter table if exists public.projects enable row level security;
drop policy if exists "public_read_projects_v272" on public.projects;
create policy "public_read_projects_v272"
on public.projects
for select
to anon, authenticated
using (true);

drop policy if exists "staff_write_projects_v272" on public.projects;
create policy "staff_write_projects_v272"
on public.projects
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- PRICING
alter table if exists public.pricing enable row level security;
drop policy if exists "public_read_pricing_v272" on public.pricing;
create policy "public_read_pricing_v272"
on public.pricing
for select
to anon, authenticated
using (true);

drop policy if exists "staff_write_pricing_v272" on public.pricing;
create policy "staff_write_pricing_v272"
on public.pricing
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- SERVICES
alter table if exists public.services enable row level security;
drop policy if exists "public_read_services_v272" on public.services;
create policy "public_read_services_v272"
on public.services
for select
to anon, authenticated
using (is_active = true or public.is_staff());

drop policy if exists "staff_write_services_v272" on public.services;
create policy "staff_write_services_v272"
on public.services
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- COMPANY SETTINGS
alter table if exists public.company_settings enable row level security;
drop policy if exists "public_read_company_settings_v272" on public.company_settings;
create policy "public_read_company_settings_v272"
on public.company_settings
for select
to anon, authenticated
using (true);

drop policy if exists "staff_write_company_settings_v272" on public.company_settings;
create policy "staff_write_company_settings_v272"
on public.company_settings
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- TASKS: staff can manage; linked customer can read.
alter table if exists public.tasks enable row level security;
drop policy if exists "tasks_read_v27" on public.tasks;
drop policy if exists "tasks_staff_write_v27" on public.tasks;
drop policy if exists "tasks_read_v272" on public.tasks;
drop policy if exists "tasks_staff_write_v272" on public.tasks;

create policy "tasks_read_v272"
on public.tasks
for select
to authenticated
using (public.is_staff() or customer_user_id = auth.uid());

create policy "tasks_staff_write_v272"
on public.tasks
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- INVOICES: staff can manage; linked customer can read.
alter table if exists public.invoices enable row level security;
drop policy if exists "invoices_read" on public.invoices;
drop policy if exists "invoices_staff_write" on public.invoices;
drop policy if exists "invoices_read_v272" on public.invoices;
drop policy if exists "invoices_staff_write_v272" on public.invoices;

create policy "invoices_read_v272"
on public.invoices
for select
to authenticated
using (public.is_staff() or customer_user_id = auth.uid());

create policy "invoices_staff_write_v272"
on public.invoices
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- PAYMENTS: staff can manage; linked customer can read payments for own invoices.
alter table if exists public.payments enable row level security;
drop policy if exists "payments_read" on public.payments;
drop policy if exists "payments_staff_write" on public.payments;
drop policy if exists "payments_read_v272" on public.payments;
drop policy if exists "payments_staff_write_v272" on public.payments;

create policy "payments_read_v272"
on public.payments
for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1
    from public.invoices i
    where i.id = payments.invoice_id
      and i.customer_user_id = auth.uid()
  )
);

create policy "payments_staff_write_v272"
on public.payments
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- CUSTOMER PROJECT UPDATES
alter table if exists public.project_updates enable row level security;
drop policy if exists "updates_read" on public.project_updates;
drop policy if exists "updates_staff_write" on public.project_updates;
drop policy if exists "updates_read_v272" on public.project_updates;
drop policy if exists "updates_staff_write_v272" on public.project_updates;

create policy "updates_read_v272"
on public.project_updates
for select
to authenticated
using (
  public.is_staff()
  or (
    customer_user_id = auth.uid()
    and is_visible_to_customer = true
  )
);

create policy "updates_staff_write_v272"
on public.project_updates
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- NOTIFICATIONS and ACTIVITY LOG are staff-only.
alter table if exists public.notifications enable row level security;
drop policy if exists "authenticated_all_notifications" on public.notifications;
drop policy if exists "staff_all_notifications_v272" on public.notifications;
create policy "staff_all_notifications_v272"
on public.notifications
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

alter table if exists public.activities enable row level security;
drop policy if exists "authenticated_all_activities" on public.activities;
drop policy if exists "staff_all_activities_v272" on public.activities;
create policy "staff_all_activities_v272"
on public.activities
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- ROLES AND EMPLOYEES are restricted to owner/manager.
alter table if exists public.roles_permissions enable row level security;
drop policy if exists "authenticated_all_roles_permissions" on public.roles_permissions;
drop policy if exists "staff_read_roles_v272" on public.roles_permissions;
drop policy if exists "management_write_roles_v272" on public.roles_permissions;

create policy "staff_read_roles_v272"
on public.roles_permissions
for select
to authenticated
using (public.is_staff());

create policy "management_write_roles_v272"
on public.roles_permissions
for all
to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));

alter table if exists public.employees enable row level security;
drop policy if exists "staff_read_employees_v272" on public.employees;
drop policy if exists "management_write_employees_v272" on public.employees;

create policy "staff_read_employees_v272"
on public.employees
for select
to authenticated
using (public.is_staff());

create policy "management_write_employees_v272"
on public.employees
for all
to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));

-- Profiles: users read their own profile; staff can read all; owner/manager can manage.
alter table if exists public.profiles enable row level security;
drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_staff_write" on public.profiles;
drop policy if exists "profiles_read_v272" on public.profiles;
drop policy if exists "profiles_management_write_v272" on public.profiles;

create policy "profiles_read_v272"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_staff());

create policy "profiles_management_write_v272"
on public.profiles
for all
to authenticated
using (public.current_role() in ('owner','manager'))
with check (public.current_role() in ('owner','manager'));
