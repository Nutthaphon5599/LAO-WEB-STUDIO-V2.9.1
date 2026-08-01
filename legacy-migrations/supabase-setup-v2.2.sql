-- Lao Web Studio V2.2 — complete, repeat-safe Supabase setup
-- Run this entire file once in Supabase Dashboard > SQL Editor > New query > Run.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id text primary key,
  category jsonb not null default '{}'::jsonb,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  url text not null,
  image_url text not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing (
  package text primary key check (package in ('starter','business','premium')),
  price text not null,
  currency text not null default 'ກີບ',
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  business_name text,
  service text not null default 'website',
  budget text,
  message text not null,
  preferred_contact text not null default 'whatsapp',
  language text not null default 'lo',
  status text not null default 'new' check (status in ('new','contacted','completed')),
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists pricing_set_updated_at on public.pricing;
create trigger pricing_set_updated_at before update on public.pricing for each row execute function public.set_updated_at();
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

insert into public.projects(id,category,name,description,url,image_url,sort_order) values
('tum-pa-guay','{"lo":"ເວັບໄຊຕ໌ຮ້ານອາຫານ","th":"เว็บไซต์ร้านอาหาร","en":"Restaurant Website"}','{"lo":"ຮ້ານຕຳຕູບປ່າກ້ວຍ","th":"ร้านตำตูบป่าก้วย","en":"Tum Pa Guay Restaurant"}','{"lo":"ເວັບໄຊຕ໌ຮ້ານອາຫານ ພ້ອມເມນູ ແຜນທີ່ ປຸ່ມຕິດຕໍ່ ແລະ ຮອງຮັບຫຼາຍພາສາ","th":"เว็บไซต์ร้านอาหาร พร้อมเมนู แผนที่ ปุ่มติดต่อ และรองรับหลายภาษา","en":"A restaurant website with menu, map, contact actions and multilingual support."}','https://nutthaphon5599.github.io/tum-pa-guay-restaurant-6.2/','assets/portfolio.jpg',0)
on conflict (id) do nothing;

insert into public.pricing(package,price,currency) values
('starter','200.000','ກີບ'),('business','500.000','ກີບ'),('premium','800.000','ກີບ')
on conflict (package) do nothing;

alter table public.projects enable row level security;
alter table public.pricing enable row level security;
alter table public.leads enable row level security;

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects" on public.projects for select to anon, authenticated using (true);
drop policy if exists "Admins can write projects" on public.projects;
create policy "Admins can write projects" on public.projects for all to authenticated using (true) with check (true);

drop policy if exists "Public can read pricing" on public.pricing;
create policy "Public can read pricing" on public.pricing for select to anon, authenticated using (true);
drop policy if exists "Admins can write pricing" on public.pricing;
create policy "Admins can write pricing" on public.pricing for all to authenticated using (true) with check (true);

drop policy if exists "Public can create leads" on public.leads;
create policy "Public can create leads" on public.leads for insert to anon, authenticated with check (status='new' and source='website');
drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads" on public.leads for select to authenticated using (true);
drop policy if exists "Admins can update leads" on public.leads;
create policy "Admins can update leads" on public.leads for update to authenticated using (true) with check (true);
drop policy if exists "Admins can delete leads" on public.leads;
create policy "Admins can delete leads" on public.leads for delete to authenticated using (true);

insert into storage.buckets(id,name,public) values ('portfolio','portfolio',true)
on conflict (id) do update set public=true;
drop policy if exists "Public portfolio images" on storage.objects;
create policy "Public portfolio images" on storage.objects for select to anon, authenticated using (bucket_id='portfolio');
drop policy if exists "Admins upload portfolio images" on storage.objects;
create policy "Admins upload portfolio images" on storage.objects for insert to authenticated with check (bucket_id='portfolio');
drop policy if exists "Admins update portfolio images" on storage.objects;
create policy "Admins update portfolio images" on storage.objects for update to authenticated using (bucket_id='portfolio') with check (bucket_id='portfolio');
drop policy if exists "Admins delete portfolio images" on storage.objects;
create policy "Admins delete portfolio images" on storage.objects for delete to authenticated using (bucket_id='portfolio');

-- Verification result: should return projects, pricing and leads.
select table_name from information_schema.tables
where table_schema='public' and table_name in ('projects','pricing','leads')
order by table_name;
