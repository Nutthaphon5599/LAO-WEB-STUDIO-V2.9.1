# V2.8.1 Form Fix

Root cause: the existing `leads.id` in the user database can be `bigint`, while V2.8 RPC returned `uuid`. V2.8.1 returns `text`, which works with both `bigint` and `uuid`. It also reloads the PostgREST schema and includes a secure direct-insert fallback without `.select()`.

## Install
1. Upload all V2.8.1 files over V2.8.
2. Run `supabase-migration-v2.8.1-form-fix.sql`.
3. Open the site in a Private tab and submit the form.
4. Check Supabase Table Editor → leads.
