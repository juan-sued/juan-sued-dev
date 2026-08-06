-- Adiciona get_published_certifications_v2() como fonte pública do portfólio.
-- A RPC anterior permanece inalterada para compatibilidade.
-- A v2 adiciona recruiter_visible ao retorno, necessário para filtrar o
-- Modo Recrutador no servidor. Mesmo modelo seguro da v1.

create or replace function public.get_published_certifications_v2()
returns table (
  id uuid,
  title_pt text,
  title_en text,
  issuer text,
  category text,
  completed_at date,
  workload_hours numeric,
  skills text[],
  featured boolean,
  recruiter_visible boolean,
  display_order integer,
  credential_url text,
  storage_bucket text,
  storage_path text
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.title_pt, c.title_en, c.issuer, c.category, c.completed_at,
         c.workload_hours, c.skills, c.featured, c.recruiter_visible,
         c.display_order, c.credential_url, c.storage_bucket, c.storage_path
  from public.certifications c
  where c.publication_status = 'published' and c.archived_at is null
  order by c.display_order asc, c.completed_at desc
$$;

revoke all on function public.get_published_certifications_v2() from public, anon, authenticated;
grant execute on function public.get_published_certifications_v2() to anon, authenticated;
