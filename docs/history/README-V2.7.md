# Lao Web Studio V2.7 Company Management

## Features
- Supabase Authentication for Owner, Manager, Staff and Customer
- Customer Portal for project progress, tasks and invoices
- Invoice and payment records in Lao kip
- Drag-and-drop Kanban board
- Revenue/outstanding/task statistics from live Supabase data
- Realtime database subscriptions
- Role-aware Row Level Security

## Installation
1. Upload all files over V2.6.1.
2. Run `supabase-migration-v2.7-company-management.sql` in Supabase SQL Editor.
3. In Supabase Authentication, create the owner account.
4. Then run:
```sql
update public.profiles
set role='owner', full_name='Nutthaphon'
where email='YOUR_OWNER_EMAIL';
```
5. Enable Email provider in Authentication → Providers.
6. Open `admin-login.html` to sign in.

## Customer account linking
A customer can sign up at `customer-login.html`. To connect their account to invoices/tasks,
copy their Auth user UUID and store it in:
- `invoices.customer_user_id`
- `tasks.customer_user_id`
- `project_updates.customer_user_id`

This release keeps all earlier CRM data. No previous tables are deleted.
