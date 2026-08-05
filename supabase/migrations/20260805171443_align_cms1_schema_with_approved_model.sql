alter table public.experiences
  add column summary_pt text,
  add column summary_en text,
  add column description_pt text,
  add column description_en text,
  add column responsibilities_pt text[] not null default '{}',
  add column responsibilities_en text[] not null default '{}',
  add column start_date date,
  add column end_date date,
  add column current boolean not null default false,
  add column location_pt text,
  add column location_en text,
  add column employment_type text,
  add column technologies text[] not null default '{}',
  add column display_order integer,
  add column featured boolean not null default false,
  add column recruiter_visible boolean not null default true,
  add column publication_status text,
  add column published_at timestamptz,
  add column archived_at timestamptz;

update public.experiences
set responsibilities_pt = array(select jsonb_array_elements_text(points_pt)),
    responsibilities_en = array(select jsonb_array_elements_text(points_en)),
    display_order = sort_order,
    publication_status = status,
    recruiter_visible = true,
    featured = sort_order < 2,
    summary_pt = points_pt ->> 0,
    summary_en = points_en ->> 0,
    description_pt = points_pt ->> 0,
    description_en = points_en ->> 0,
    published_at = case when status = 'published' then coalesce(published_at, now()) else null end;

alter table public.experiences
  alter column display_order set not null,
  alter column publication_status set not null,
  add constraint experiences_display_order_nonnegative check (display_order >= 0),
  add constraint experiences_publication_status_valid check (publication_status in ('draft', 'published', 'archived')),
  add constraint experiences_dates_valid check (end_date is null or start_date is null or end_date >= start_date),
  add constraint experiences_archived_consistent check (publication_status <> 'archived' or archived_at is not null);

alter table public.skills
  add column name text,
  add column name_pt text,
  add column name_en text,
  add column category text,
  add column display_order integer,
  add column featured boolean not null default false,
  add column recruiter_visible boolean not null default true,
  add column publication_status text,
  add column published_at timestamptz,
  add column archived_at timestamptz;

update public.skills
set name_pt = category_pt,
    name_en = category_en,
    category = case sort_order when 0 then 'frontend_mobile' when 1 then 'backend' when 2 then 'data' when 3 then 'geolocation' when 4 then 'quality_delivery' end,
    display_order = sort_order,
    publication_status = status,
    featured = sort_order < 2,
    recruiter_visible = true,
    published_at = case when status = 'published' then coalesce(published_at, now()) else null end;

alter table public.skills
  alter column category set not null,
  alter column display_order set not null,
  alter column publication_status set not null,
  add constraint skills_display_order_nonnegative check (display_order >= 0),
  add constraint skills_category_valid check (category in ('frontend_mobile', 'backend', 'data', 'geolocation', 'quality_delivery')),
  add constraint skills_publication_status_valid check (publication_status in ('draft', 'published', 'archived')),
  add constraint skills_archived_consistent check (publication_status <> 'archived' or archived_at is not null);

alter table public.education
  add column course_pt text,
  add column course_en text,
  add column description_pt text,
  add column description_en text,
  add column start_date date,
  add column end_date date,
  add column current boolean not null default false,
  add column display_order integer,
  add column publication_status text,
  add column published_at timestamptz,
  add column archived_at timestamptz;

update public.education
set course_pt = program_pt,
    course_en = program_en,
    description_pt = detail_pt,
    description_en = detail_en,
    display_order = sort_order,
    publication_status = status,
    published_at = case when status = 'published' then coalesce(published_at, now()) else null end;

alter table public.education
  alter column display_order set not null,
  alter column publication_status set not null,
  add constraint education_display_order_nonnegative check (display_order >= 0),
  add constraint education_publication_status_valid check (publication_status in ('draft', 'published', 'archived')),
  add constraint education_dates_valid check (end_date is null or start_date is null or end_date >= start_date),
  add constraint education_archived_consistent check (publication_status <> 'archived' or archived_at is not null);

drop view public.published_experiences;
drop view public.published_skills;
drop view public.published_education;

create view public.published_experiences with (security_barrier = true, security_invoker = false) as
select id, company, role_pt, role_en, summary_pt, summary_en, description_pt, description_en, responsibilities_pt, responsibilities_en, start_date, end_date, current, location_pt, location_en, employment_type, technologies, display_order, featured, recruiter_visible
from public.experiences where publication_status = 'published' and archived_at is null;
create view public.published_skills with (security_barrier = true, security_invoker = false) as
select id, name, name_pt, name_en, category, display_order, featured, recruiter_visible
from public.skills where publication_status = 'published' and archived_at is null;
create view public.published_education with (security_barrier = true, security_invoker = false) as
select id, institution, course_pt, course_en, description_pt, description_en, start_date, end_date, current, display_order
from public.education where publication_status = 'published' and archived_at is null;

grant select on public.published_experiences, public.published_skills, public.published_education to anon, authenticated;
