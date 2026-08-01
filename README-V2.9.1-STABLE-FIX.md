# Lao Web Studio V2.9.1 Stable Fix

This release is a targeted fix based on V2.9.0. It does not rebuild or
delete the existing website, CRM tables, customers, quotations, tasks,
invoices, payments, or portal data.

## Fixes

- Reliable Admin and Customer login error messages.
- Repairs missing `profiles` rows for existing Supabase Auth users.
- Assigns `natthaphon.slt555@gmail.com` the Owner role.
- Adds the restricted `lws_ensure_my_profile()` repair RPC.
- Adds exact checks for Supabase, health RPC, session and profile.
- Cache busting prevents GitHub Pages and Safari from using older JS.
- Keeps the V2.9.0 public lead RPC and all existing pages.

## Install

1. Upload all V2.9.1 files over V2.9.0 in the same GitHub repository.
2. Run `SUPABASE-V2.9.1-STABLE-FIX.sql` once.
3. Open `system-check.html`.
4. Confirm:
   - Supabase configured = true
   - Database health = Connected
   - Database version = 2.9.1
   - Public lead RPC = true
5. Open `admin-login.html` and log in.

Do not run V3.0 SQL. Do not delete the existing Supabase project.
