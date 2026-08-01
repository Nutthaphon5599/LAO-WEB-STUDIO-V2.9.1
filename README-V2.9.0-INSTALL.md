# Lao Web Studio V2.9.0 — Complete Rebuild

This package keeps all website and Admin pages from V2.8.1 and replaces
the fragmented Supabase installation with one complete setup.

## Important files

- `SUPABASE-COMPLETE-SETUP-V2.9.0.sql` — the only setup file to run
- `VERIFY-SUPABASE-V2.9.0.sql` — optional database test
- `system-check.html` — checks that the deployed website and Supabase are
  using V2.9.0
- `supabase-config.js` — Supabase Project URL and publishable/anon key

## Installation

1. Upload every V2.9.0 file over the current GitHub repository.
2. Wait for GitHub Pages deployment to become green.
3. In Supabase SQL Editor, run the complete
   `SUPABASE-COMPLETE-SETUP-V2.9.0.sql` file.
4. The result must contain:
   - version: `2.9.0`
   - rpc_ready: `true`
   - health_check_ready: `true`
   - tables_ready: `17`
5. Open `/system-check.html` on the deployed website.
6. Every check should be green.
7. Test the public quotation form.
8. Confirm the new customer appears in Table Editor → `leads`.

## Authentication owner

The installer backfills existing Auth users. If no owner exists, the
oldest Authentication user becomes the Owner automatically.

To set a specific account as Owner manually:

```sql
update public.profiles
set role='owner', full_name='Nutthaphon', is_active=true
where email='YOUR_EMAIL';
```

## Do not run old migrations again

Old migration files are retained only in `legacy-migrations/` for history.
After V2.9.0, use the complete V2.9.0 setup as the single source of truth.
