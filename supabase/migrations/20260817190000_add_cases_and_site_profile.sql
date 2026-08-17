create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title_pt text not null check (char_length(btrim(title_pt)) between 1 and 200),
  title_en text not null check (char_length(btrim(title_en)) between 1 and 200),
  tag text not null check (char_length(btrim(tag)) between 1 and 100),
  summary_pt text not null check (char_length(btrim(summary_pt)) between 1 and 400),
  summary_en text not null check (char_length(btrim(summary_en)) between 1 and 400),
  decision_pt text not null check (char_length(btrim(decision_pt)) between 1 and 400),
  decision_en text not null check (char_length(btrim(decision_en)) between 1 and 400),
  stack text not null check (char_length(btrim(stack)) between 1 and 300),
  sections_pt jsonb not null check (jsonb_typeof(sections_pt) = 'array' and jsonb_array_length(sections_pt) > 0),
  sections_en jsonb not null check (jsonb_typeof(sections_en) = 'array' and jsonb_array_length(sections_en) > 0),
  display_order integer not null default 0 check (display_order >= 0),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (display_order),
  constraint cases_published_requires_published_at check (publication_status <> 'published' or published_at is not null),
  constraint cases_archived_requires_archived_at check (publication_status <> 'archived' or archived_at is not null)
);

alter table public.cases enable row level security;

create policy "admins select cases" on public.cases
for select to authenticated using (public.is_admin());

create policy "admins insert cases" on public.cases
for insert to authenticated with check (public.is_admin());

create policy "admins update cases" on public.cases
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger cases_set_updated_at before update on public.cases
for each row execute function public.set_updated_at();

create index cases_publication_status_idx on public.cases (publication_status);
create index cases_display_order_idx on public.cases (display_order);

create view public.published_cases
with (security_barrier = true, security_invoker = false) as
select id, slug, title_pt, title_en, tag, summary_pt, summary_en, decision_pt, decision_en, stack, sections_pt, sections_en, display_order
from public.cases where publication_status = 'published' and archived_at is null
order by display_order asc;

revoke all on public.cases from public, anon;
grant select, insert, update on public.cases to authenticated;
revoke all on public.published_cases from public, anon, authenticated;
grant select on public.published_cases to anon, authenticated;

create table public.site_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  role_pt text not null check (char_length(btrim(role_pt)) between 1 and 160),
  role_en text not null check (char_length(btrim(role_en)) between 1 and 160),
  intro_pt text not null check (char_length(btrim(intro_pt)) between 1 and 600),
  intro_en text not null check (char_length(btrim(intro_en)) between 1 and 600),
  location_pt text not null check (char_length(btrim(location_pt)) between 1 and 120),
  location_en text not null check (char_length(btrim(location_en)) between 1 and 120),
  link_bikerway text,
  link_event_horizon text,
  link_linkedin text,
  link_github text,
  link_email text,
  updated_at timestamptz not null default now()
);

alter table public.site_profile enable row level security;

create policy "admins select site profile" on public.site_profile
for select to authenticated using (public.is_admin());

create policy "admins update site profile" on public.site_profile
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create trigger site_profile_set_updated_at before update on public.site_profile
for each row execute function public.set_updated_at();

create view public.published_site_profile
with (security_barrier = true, security_invoker = false) as
select id, name, role_pt, role_en, intro_pt, intro_en, location_pt, location_en, link_bikerway, link_event_horizon, link_linkedin, link_github, link_email
from public.site_profile limit 1;

revoke all on public.site_profile from public, anon;
grant select, update on public.site_profile to authenticated;
revoke all on public.published_site_profile from public, anon, authenticated;
grant select on public.published_site_profile to anon, authenticated;
