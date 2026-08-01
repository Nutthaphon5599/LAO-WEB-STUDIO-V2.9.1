# V2.8 Enterprise Stable — Audit Summary

## Root cause found

The public form used:

```js
.from('leads').insert(payload).select('id').single()
```

The insert policy allowed a public INSERT, but `.select('id')` also requested the inserted row back.
That return query requires a public SELECT policy. Giving public SELECT access to CRM leads would expose
customer data, so V2.8 does not do that.

V2.8 replaces the operation with the restricted Supabase RPC `submit_public_lead`.
The function accepts only customer form fields and forces:

- `status = new`
- `source = website`
- server timestamps

No public SELECT permission on `leads` is required.

## Other fixes

- Raw Supabase errors are no longer printed to public visitors.
- Cache-busting query strings prevent Safari/GitHub Pages from loading old JavaScript.
- One idempotent V2.8 SQL migration replaces repeated manual RLS fixes.
- Legacy restrictive policies on `leads` are removed before V2.8 policies are created.
- Public read and staff-write rules are restored for projects, pricing, services and company settings.
- `__MACOSX` metadata is not included in the clean V2.8 package.

## Installation order

1. Upload all V2.8 files over the current GitHub repository.
2. Run `supabase-migration-v2.8-enterprise-stable.sql`.
3. Confirm the result row shows `rpc_ready = true`.
4. Open the public website in a Private tab and submit one quotation request.
5. Confirm the new record appears in Supabase → Table Editor → leads.

Do not rerun old V2.2–V2.7 migration files after V2.8.
