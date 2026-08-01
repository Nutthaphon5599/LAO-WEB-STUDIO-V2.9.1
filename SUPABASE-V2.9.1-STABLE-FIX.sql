-- =====================================================================
-- Lao Web Studio V2.9.1 Stable Fix
-- TARGETED PATCH: keeps existing tables and data.
-- Run once after the V2.9.0 complete setup.
-- =====================================================================

-- Ensure profile columns expected by the website exist.
alter table public.profiles
  add column if not exists full_name text not null default '',
  add column if not exists email text,
  add column if not exists role text not null default 'customer',
  add column if not exists lead_id text,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Backfill every existing Authentication user into profiles.
insert into public.profiles(
  id, full_name, email, role, is_active, created_at, updated_at
)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name',''),
  u.email,
  case
    when lower(coalesce(u.email,'')) = 'natthaphon.slt555@gmail.com'
      then 'owner'
    when not exists(
      select 1 from public.profiles where role='owner'
    ) and row_number() over(order by u.created_at)=1
      then 'owner'
    else coalesce(
      nullif(u.raw_user_meta_data->>'role',''),
      'customer'
    )
  end,
  true,
  coalesce(u.created_at,now()),
  now()
from auth.users u
on conflict(id) do update set
  email=excluded.email,
  full_name=case
    when public.profiles.full_name='' then excluded.full_name
    else public.profiles.full_name
  end,
  role=case
    when lower(coalesce(excluded.email,'')) =
      'natthaphon.slt555@gmail.com'
      then 'owner'
    else public.profiles.role
  end,
  is_active=true,
  updated_at=now();

-- Explicitly repair the owner's account when that email exists.
update public.profiles p
set
  full_name=case
    when nullif(p.full_name,'') is null then 'Nutthaphon'
    else p.full_name
  end,
  role='owner',
  is_active=true,
  updated_at=now()
from auth.users u
where p.id=u.id
  and lower(u.email)='natthaphon.slt555@gmail.com';

-- Trigger for future users.
create or replace function public.lws_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(
    id,full_name,email,role,is_active,created_at,updated_at
  )
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.email,
    case
      when lower(coalesce(new.email,'')) =
        'natthaphon.slt555@gmail.com'
        then 'owner'
      when not exists(
        select 1 from public.profiles where role='owner'
      )
        then 'owner'
      else coalesce(
        nullif(new.raw_user_meta_data->>'role',''),
        'customer'
      )
    end,
    true,
    now(),
    now()
  )
  on conflict(id) do update set
    email=excluded.email,
    is_active=true,
    updated_at=now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.lws_handle_new_user();

-- Role helpers.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(
    (
      select role
      from public.profiles
      where id=auth.uid() and is_active=true
    ),
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

-- Allows the signed-in user to repair only their own missing profile.
create or replace function public.lws_ensure_my_profile()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user auth.users%rowtype;
  v_role text;
begin
  select * into v_user
  from auth.users
  where id=auth.uid();

  if v_user.id is null then
    raise exception 'not_authenticated';
  end if;

  v_role := case
    when lower(coalesce(v_user.email,'')) =
      'natthaphon.slt555@gmail.com'
      then 'owner'
    else coalesce(
      (
        select role from public.profiles
        where id=v_user.id
      ),
      'customer'
    )
  end;

  insert into public.profiles(
    id,full_name,email,role,is_active,created_at,updated_at
  )
  values(
    v_user.id,
    coalesce(v_user.raw_user_meta_data->>'full_name',''),
    v_user.email,
    v_role,
    true,
    coalesce(v_user.created_at,now()),
    now()
  )
  on conflict(id) do update set
    email=excluded.email,
    role=case
      when lower(coalesce(excluded.email,'')) =
        'natthaphon.slt555@gmail.com'
        then 'owner'
      else public.profiles.role
    end,
    is_active=true,
    updated_at=now();

  return (
    select to_jsonb(p)
    from public.profiles p
    where p.id=v_user.id
  );
end;
$$;

revoke all on function public.lws_ensure_my_profile() from public;
grant execute on function public.lws_ensure_my_profile()
to authenticated;

-- Rebuild only profile policies, preserving all other V2.9 tables.
alter table public.profiles enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname='public'
      and tablename='profiles'
  loop
    execute format(
      'drop policy if exists %I on public.profiles',
      p.policyname
    );
  end loop;
end $$;

create policy "v291_profiles_read_own_or_staff"
on public.profiles for select to authenticated
using(id=auth.uid() or public.is_staff());

create policy "v291_profiles_update_own_basic"
on public.profiles for update to authenticated
using(id=auth.uid())
with check(id=auth.uid());

create policy "v291_profiles_management"
on public.profiles for all to authenticated
using(public.current_role() in ('owner','manager'))
with check(public.current_role() in ('owner','manager'));

-- Health check now reports V2.9.1.
create or replace function public.lws_public_health_check()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'ok',true,
    'version','2.9.1',
    'lead_rpc',
      to_regprocedure(
        'public.submit_public_lead(text,text,text,text,text,text,text,text,text)'
      ) is not null,
    'profile_rpc',
      to_regprocedure('public.lws_ensure_my_profile()') is not null,
    'checked_at',now()
  );
$$;

revoke all on function public.lws_public_health_check() from public;
grant execute on function public.lws_public_health_check()
to anon,authenticated;

notify pgrst,'reload schema';

select jsonb_build_object(
  'result','V2.9.1 Stable Fix installed',
  'version','2.9.1',
  'owner_profile',(
    select jsonb_build_object(
      'email',p.email,
      'role',p.role,
      'active',p.is_active
    )
    from public.profiles p
    where lower(coalesce(p.email,'')) =
      'natthaphon.slt555@gmail.com'
    limit 1
  ),
  'profile_rpc_ready',
    to_regprocedure('public.lws_ensure_my_profile()') is not null,
  'lead_rpc_ready',
    to_regprocedure(
      'public.submit_public_lead(text,text,text,text,text,text,text,text,text)'
    ) is not null,
  'installed_at',now()
) as installation_result;
