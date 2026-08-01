
-- V2.7.2 verification
select tablename, policyname, roles, cmd
from pg_policies
where schemaname='public'
  and tablename in (
    'leads','appointments','quotations','client_files','projects','pricing',
    'services','company_settings','tasks','invoices','payments',
    'project_updates','notifications','activities','roles_permissions',
    'employees','profiles'
  )
order by tablename, policyname;
