# RLS Manual Checklist

Run after migration deploy and before production release. Use Supabase SQL Editor as project owner; do not run checks with service role as proof of user access.

## Migration State

- [ ] Confirm remote migration history matches `supabase/migrations` with `npm run supabase:migration:list`.
- [ ] Review every pending migration before `npm run supabase:db:push`.
- [ ] Confirm tables exist: `admin_users`, `admin_invites`, `contact_submissions`, `contact_notes`, `opportunities`, `audit_logs`.
- [ ] Confirm `opportunities_one_per_contact_idx` exists.
- [ ] Confirm `public.is_admin()` remains `security definer` with `search_path = public`.

## RLS Enabled

Run:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'admin_users', 'admin_invites', 'contact_submissions',
    'contact_notes', 'opportunities', 'audit_logs'
  )
order by tablename;
```

- [ ] Every listed table returns `rowsecurity = true`.
- [ ] `admin_invites` has no client-access policy unless explicit workflow requires one.
- [ ] No broad `anon` policy exists on CRM tables.

## Policy Review

Run:

```sql
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

- [ ] `admin_users`: authenticated user can read only own membership (`id = auth.uid()`).
- [ ] `contact_submissions`, `contact_notes`, `opportunities`: authenticated admin-only management policies use `public.is_admin()` for `using` and `with check`.
- [ ] `audit_logs`: admins can read and insert only; no update or delete policy unless explicitly approved.
- [ ] Historical `public can submit contacts` policy is absent. Public contact inserts go through server handler using service role, not direct client access.

## Role Tests

- [ ] Unauthenticated browser cannot select, insert, update or delete CRM rows through Supabase API.
- [ ] Authenticated non-admin cannot read or modify CRM rows, audit logs, memberships or invites.
- [ ] Admin user in `admin_users` can perform expected CRM reads and writes.
- [ ] New authenticated user without valid invite has no `admin_users` row.
- [ ] Valid invite creates one `admin_users` row; used or expired invite creates none.
- [ ] Duplicate opportunity for same non-null contact fails due to unique partial index.

## Contact Intake

- [ ] Production Vercel has `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` set.
- [ ] Missing or invalid Turnstile token returns generic failure; no contact row is written.
- [ ] Missing Turnstile config in production returns generic failure; no contact row is written.
- [ ] Sixth request from same IP hash within 60 seconds returns HTTP 429. Treat result as per-instance only.
- [ ] Service role key is server-only, absent from browser bundle and never named `NEXT_PUBLIC_*`.

## Release Record

- [ ] Record migration versions, reviewer, timestamp and test admin user.
- [ ] Remove test contacts, test opportunities and unused invites after verification.
- [ ] Revoke and replace any secret exposed in logs, commits or screenshots.
