# Lao Web Studio V2.6.1 Enterprise

## Important installation order
1. Upload all project files to GitHub, replacing V2.5.1/V2.6 files.
2. In Supabase → SQL Editor, open `supabase-migration-v2.6.1-enterprise.sql`.
3. Copy all SQL, click Run, and wait for Success.
4. Sign in to Admin and test the new pages.

## New Supabase tables
- `tasks` – work tracking, assignee, deadline, priority, progress
- `activities` – audit/activity history
- `notifications` – unread/read alerts
- `company_settings` – editable company information
- `services` – editable services and prices
- `roles_permissions` – Owner/Manager/Staff page permissions

## New Admin pages
- `admin-tasks.html`
- `admin-services.html`
- `admin-notifications.html`
- `admin-settings.html`

Existing pages and data are preserved. The migration does not delete existing customer, appointment, quotation, portfolio, pricing, file, or employee data.

## Security note
The migration enables RLS and allows authenticated users. For a larger team, create each employee in Supabase Authentication and link `employees.auth_user_id`.
