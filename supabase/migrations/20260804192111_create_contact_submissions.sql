create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "admins can read their own membership"
on public.admin_users
for select
to authenticated
using (id = auth.uid());

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 120),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

create policy "public can submit contacts"
on public.contact_submissions
for insert
to anon
with check (true);

create policy "admin can read contact submissions"
on public.contact_submissions
for select
to authenticated
using (exists (select 1 from public.admin_users where id = auth.uid()));
