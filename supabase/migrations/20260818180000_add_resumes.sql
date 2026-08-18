create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique check (kind in ('ats', 'visual')),
  storage_bucket text not null default 'resumes' check (storage_bucket = 'resumes'),
  storage_path text not null check (storage_path ~ '^[a-z0-9/_-]+\.pdf$'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.resumes enable row level security;

create policy "admins select resumes" on public.resumes
for select to authenticated using (public.is_admin());

create policy "admins insert resumes" on public.resumes
for insert to authenticated with check (public.is_admin());

create policy "admins update resumes" on public.resumes
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger resumes_set_updated_at before update on public.resumes
for each row execute function public.set_updated_at();

create view public.published_resumes
with (security_barrier = true, security_invoker = false) as
select kind, storage_bucket, storage_path
from public.resumes;

revoke all on public.resumes from public, anon;
grant select, insert, update on public.resumes to authenticated;
revoke all on public.published_resumes from public, anon, authenticated;
grant select on public.published_resumes to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', true, 10485760, array['application/pdf']::text[])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "admins select resume files" on storage.objects
for select to authenticated using (bucket_id = 'resumes' and public.is_admin());

create policy "admins insert resume files" on storage.objects
for insert to authenticated with check (bucket_id = 'resumes' and public.is_admin());

create policy "admins update resume files" on storage.objects
for update to authenticated using (bucket_id = 'resumes' and public.is_admin()) with check (bucket_id = 'resumes' and public.is_admin());

create policy "admins delete resume files" on storage.objects
for delete to authenticated using (bucket_id = 'resumes' and public.is_admin());
