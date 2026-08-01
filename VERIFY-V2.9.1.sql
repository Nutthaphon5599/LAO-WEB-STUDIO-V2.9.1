-- V2.9.1 verification
select public.lws_public_health_check() as health;

select
  u.id,
  u.email as auth_email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_active
from auth.users u
left join public.profiles p on p.id=u.id
where lower(u.email)='natthaphon.slt555@gmail.com';

select
  to_regprocedure('public.lws_ensure_my_profile()') is not null
    as profile_rpc_ready,
  to_regprocedure(
    'public.submit_public_lead(text,text,text,text,text,text,text,text,text)'
  ) is not null as lead_rpc_ready;
