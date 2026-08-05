create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  title_pt text not null check (char_length(btrim(title_pt)) between 1 and 200),
  title_en text not null check (char_length(btrim(title_en)) between 1 and 200),
  issuer text not null check (char_length(btrim(issuer)) between 1 and 160),
  category text not null check (category in ('frontend', 'backend', 'database', 'mobile', 'cloud', 'devops', 'architecture', 'quality', 'general')),
  completed_at date not null,
  workload_hours numeric(5, 1) check (workload_hours is null or workload_hours > 0),
  storage_bucket text not null default 'certifications' check (storage_bucket = 'certifications'),
  storage_path text not null unique check (
    storage_path = btrim(storage_path)
    and storage_path like '%.pdf'
    and storage_path not like '/%'
    and storage_path not like '%..%'
    and position('?' in storage_path) = 0
  ),
  credential_url text check (credential_url is null or credential_url like 'https://%'),
  skills text[] not null default '{}',
  featured boolean not null default false,
  recruiter_visible boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint certifications_published_requires_published_at check (publication_status <> 'published' or published_at is not null),
  constraint certifications_archived_requires_archived_at check (publication_status <> 'archived' or archived_at is not null),
  constraint certifications_published_not_archived check (publication_status <> 'published' or archived_at is null)
);

alter table public.certifications enable row level security;

create policy "admins select certifications" on public.certifications
for select to authenticated using (public.is_admin());

create policy "admins insert certifications" on public.certifications
for insert to authenticated with check (public.is_admin());

create policy "admins update certifications" on public.certifications
for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.certifications from public, anon;
grant select, insert, update on public.certifications to authenticated;

drop trigger if exists certifications_set_updated_at on public.certifications;
create trigger certifications_set_updated_at
before update on public.certifications
for each row execute function public.set_updated_at();

create index certifications_publication_status_idx on public.certifications(publication_status);
create index certifications_display_order_idx on public.certifications(display_order);
create index certifications_featured_idx on public.certifications(featured);
create index certifications_recruiter_visible_idx on public.certifications(recruiter_visible);
create index certifications_category_idx on public.certifications(category);
create index certifications_completed_at_idx on public.certifications(completed_at);

create or replace function public.get_published_certifications()
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
  display_order integer,
  credential_url text,
  storage_bucket text,
  storage_path text
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.title_pt, c.title_en, c.issuer, c.category, c.completed_at,
         c.workload_hours, c.skills, c.featured, c.display_order,
         c.credential_url, c.storage_bucket, c.storage_path
  from public.certifications c
  where c.publication_status = 'published' and c.archived_at is null
  order by c.display_order asc, c.completed_at desc
$$;

revoke all on function public.get_published_certifications() from public, anon, authenticated;
grant execute on function public.get_published_certifications() to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certifications', 'certifications', true, 10485760, array['application/pdf']::text[])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf']::text[];

drop policy if exists "admins select certification files" on storage.objects;
create policy "admins select certification files" on storage.objects
for select to authenticated using (bucket_id = 'certifications' and public.is_admin());

drop policy if exists "admins insert certification files" on storage.objects;
create policy "admins insert certification files" on storage.objects
for insert to authenticated with check (bucket_id = 'certifications' and public.is_admin());

drop policy if exists "admins update certification files" on storage.objects;
create policy "admins update certification files" on storage.objects
for update to authenticated using (bucket_id = 'certifications' and public.is_admin()) with check (bucket_id = 'certifications' and public.is_admin());

drop policy if exists "admins delete certification files" on storage.objects;
create policy "admins delete certification files" on storage.objects
for delete to authenticated using (bucket_id = 'certifications' and public.is_admin());
