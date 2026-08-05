drop view public.published_experiences;
drop view public.published_skills;
drop view public.published_education;

create view public.published_experiences with (security_barrier = true, security_invoker = false) as
select id, company, role_pt, role_en, period_pt, period_en, points_pt, points_en, summary_pt, summary_en, description_pt, description_en, responsibilities_pt, responsibilities_en, start_date, end_date, current, location_pt, location_en, employment_type, technologies, display_order, featured, recruiter_visible
from public.experiences where publication_status = 'published' and archived_at is null;
create view public.published_skills with (security_barrier = true, security_invoker = false) as
select id, category_pt, category_en, items, name, name_pt, name_en, category, display_order, featured, recruiter_visible
from public.skills where publication_status = 'published' and archived_at is null;
create view public.published_education with (security_barrier = true, security_invoker = false) as
select id, institution, program_pt, program_en, detail_pt, detail_en, course_pt, course_en, description_pt, description_en, start_date, end_date, current, display_order
from public.education where publication_status = 'published' and archived_at is null;
grant select on public.published_experiences, public.published_skills, public.published_education to anon, authenticated;
