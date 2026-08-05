create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where id = auth.uid()) $$;

alter table public.contact_submissions
  add column company text,
  add column subject text,
  add column source_path text,
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column referrer text,
  add column status text not null default 'new' check (status in ('new','reviewing','contacted','opportunity','interview','proposal','hired','closed','spam')),
  add column priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  add column assigned_to uuid references auth.users(id),
  add column last_contact_at timestamptz,
  add column next_action_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add column archived_at timestamptz;

drop policy "public can submit contacts" on public.contact_submissions;
create policy "admins manage contacts" on public.contact_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.contact_notes (
  id uuid primary key default gen_random_uuid(), contact_id uuid not null references public.contact_submissions(id) on delete cascade,
  author_id uuid not null references auth.users(id), content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.contact_notes enable row level security;
create policy "admins manage contact notes" on public.contact_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.opportunities (
  id uuid primary key default gen_random_uuid(), contact_id uuid references public.contact_submissions(id) on delete set null,
  title text not null check (char_length(title) between 2 and 180), company_name text,
  employment_type text, work_model text, salary_min numeric, salary_max numeric, currency text not null default 'BRL',
  status text not null default 'prospect' check (status in ('prospect','applied','recruiter_contact','screening','technical_interview','final_interview','offer','hired','rejected','withdrawn')),
  source text, job_url text, next_action_at timestamptz, interview_at timestamptz, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), closed_at timestamptz
);
alter table public.opportunities enable row level security;
create policy "admins manage opportunities" on public.opportunities for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id), entity_type text not null, entity_id uuid not null,
  action text not null, changes jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create policy "admins read audit logs" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "admins write audit logs" on public.audit_logs for insert to authenticated with check (public.is_admin());

create index contact_submissions_status_created_idx on public.contact_submissions(status, created_at desc);
create index contact_submissions_next_action_idx on public.contact_submissions(next_action_at) where archived_at is null;
create index opportunities_status_created_idx on public.opportunities(status, created_at desc);
