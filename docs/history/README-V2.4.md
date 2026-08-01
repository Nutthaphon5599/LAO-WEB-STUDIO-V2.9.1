# Lao Web Studio V2.4 — CRM Pro

V2.4 keeps the V2.3 website, three languages, Supabase, pricing and portfolio. It adds:
- Owner/employee structure (seeded with Nutthaphon and ready for future staff)
- Expanded CRM workflow: New, Contacted, Quotation Sent, In Progress, Waiting, Completed, Cancelled
- Priority, owner, follow-up date and internal notes
- Business dashboard and quotation totals
- Quotation numbers such as LWS-2026-0001
- Print / Save as PDF quotation
- WhatsApp and email actions

## Required upgrade
Run `supabase-migration-v2.4.sql` once in Supabase SQL Editor. It is repeat-safe and does not delete existing customer records.

Automatic WhatsApp/email sending is intentionally not enabled in this static GitHub Pages version because secrets cannot be stored safely in browser JavaScript. V2.4 provides direct contact buttons; automatic notifications can later be added using a Supabase Edge Function.
