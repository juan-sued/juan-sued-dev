create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(btrim(company)) between 1 and 160),
  role_pt text not null check (char_length(btrim(role_pt)) between 1 and 160),
  role_en text not null check (char_length(btrim(role_en)) between 1 and 160),
  period_pt text not null check (char_length(btrim(period_pt)) between 1 and 100),
  period_en text not null check (char_length(btrim(period_en)) between 1 and 100),
  points_pt jsonb not null check (jsonb_typeof(points_pt) = 'array' and jsonb_array_length(points_pt) > 0),
  points_en jsonb not null check (jsonb_typeof(points_en) = 'array' and jsonb_array_length(points_en) > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sort_order)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  category_pt text not null check (char_length(btrim(category_pt)) between 1 and 100),
  category_en text not null check (char_length(btrim(category_en)) between 1 and 100),
  items text not null check (char_length(btrim(items)) between 1 and 1000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sort_order)
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null check (char_length(btrim(institution)) between 1 and 160),
  program_pt text not null check (char_length(btrim(program_pt)) between 1 and 200),
  program_en text not null check (char_length(btrim(program_en)) between 1 and 200),
  detail_pt text not null check (char_length(btrim(detail_pt)) between 1 and 1000),
  detail_en text not null check (char_length(btrim(detail_en)) between 1 and 1000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sort_order)
);

alter table public.experiences enable row level security;
alter table public.skills enable row level security;
alter table public.education enable row level security;

create policy "admins manage experiences" on public.experiences
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins manage skills" on public.skills
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins manage education" on public.education
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index experiences_published_sort_idx on public.experiences (sort_order) where status = 'published';
create index skills_published_sort_idx on public.skills (sort_order) where status = 'published';
create index education_published_sort_idx on public.education (sort_order) where status = 'published';

create view public.published_experiences
with (security_barrier = true, security_invoker = false) as
select id, company, role_pt, role_en, period_pt, period_en, points_pt, points_en, sort_order
from public.experiences
where status = 'published';

create view public.published_skills
with (security_barrier = true, security_invoker = false) as
select id, category_pt, category_en, items, sort_order
from public.skills
where status = 'published';

create view public.published_education
with (security_barrier = true, security_invoker = false) as
select id, institution, program_pt, program_en, detail_pt, detail_en, sort_order
from public.education
where status = 'published';

revoke all on public.experiences, public.skills, public.education from public, anon;
grant select, insert, update, delete on public.experiences, public.skills, public.education to authenticated;

revoke all on public.published_experiences, public.published_skills, public.published_education from public, anon, authenticated;
grant select on public.published_experiences, public.published_skills, public.published_education to anon, authenticated;
