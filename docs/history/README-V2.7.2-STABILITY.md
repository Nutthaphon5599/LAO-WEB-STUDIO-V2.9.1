# Lao Web Studio V2.7.2 Stability Update

## Main fix
Public quotation requests can now be inserted into `public.leads` without signing in.

The website no longer shows raw Supabase messages such as:

`new row violates row-level security policy for table "leads"`

Visitors now receive a friendly Lao, Thai or English message.

## Security review included
- Public visitors: insert leads, read public projects/pricing/services/company settings
- Staff: manage leads, appointments, quotations, files, tasks, invoices and payments
- Customers: read only tasks, invoices, payments and project updates linked to their Auth user ID
- Owner/Manager: manage employee profiles and role permissions
- Notifications and activity logs: staff only

## Installation
1. Upload all V2.7.2 files over V2.7.1 in GitHub.
2. Open Supabase → SQL Editor.
3. Run `supabase-migration-v2.7.2-stability.sql`.
4. Test the public quotation form again.
5. Optional: run `verify-v2.7.2-policies.sql` to inspect installed policies.

No existing customers, leads, appointments, quotations, tasks, invoices or payments are deleted.
