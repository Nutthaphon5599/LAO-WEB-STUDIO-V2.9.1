-- Lao Web Studio V2.5.1 migration — safe and repeatable
-- Adds professional appointment fields without deleting existing data.
alter table public.appointments add column if not exists location text;
alter table public.appointments add column if not exists reminder_minutes integer not null default 60;
alter table public.appointments add column if not exists reminder_sent boolean not null default false;
create index if not exists appointments_status_date_idx on public.appointments(status,appointment_at);
notify pgrst,'reload schema';
select column_name,data_type from information_schema.columns
where table_schema='public' and table_name='appointments'
order by ordinal_position;
