# Lao Web Studio V2.2

## New in V2.2
- One repeat-safe Supabase installer for `projects`, `pricing`, `leads`, Storage and RLS policies.
- Automatic `updated_at` triggers.
- CRM dashboard with New / Contacted / Completed filters.
- Search customers and export all leads to CSV.
- Clear error message when the `leads` table has not been installed.
- Existing Luxury theme, portfolio, pricing, Admin authentication and Supabase configuration remain unchanged.

## Install Supabase
1. Open Supabase Dashboard → SQL Editor → New query.
2. Open `supabase-setup-v2.2.sql` from this project.
3. Copy all SQL, paste it into the editor and click **Run** once.
4. The result at the bottom should list: `leads`, `pricing`, `projects`.
5. In Supabase Authentication → Users, create the Admin user if one does not exist.
6. Keep your existing Project URL and anon key in `supabase-config.js`.

## Publish to GitHub
Upload every file inside this folder to the root of the existing GitHub repository. Do not upload the outer folder itself. Wait for GitHub Pages deployment, then refresh the site.

Admin page: `admin.html`
