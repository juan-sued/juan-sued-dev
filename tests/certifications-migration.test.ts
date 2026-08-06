import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase", "migrations", "20260805173212_add_certifications_management.sql"), "utf8");

describe("certifications migration", () => {
  it("creates the certifications table with full constraints", () => {
    expect(migration).toContain("create table public.certifications");
    expect(migration).toMatch(/category text not null check \(category in \('frontend', 'backend', 'database', 'mobile', 'cloud', 'devops', 'architecture', 'quality', 'general'\)\)/);
    expect(migration).toMatch(/workload_hours numeric\(5, 1\) check \(workload_hours is null or workload_hours > 0\)/);
    expect(migration).toMatch(/storage_bucket text not null default 'certifications' check \(storage_bucket = 'certifications'\)/);
    expect(migration).toMatch(/storage_path text not null unique check/);
    expect(migration).toMatch(/credential_url text check \(credential_url is null or credential_url like 'https:\/\/%'\)/);
    expect(migration).toMatch(/publication_status text not null default 'draft' check \(publication_status in \('draft', 'published', 'archived'\)\)/);
    expect(migration).toMatch(/certifications_published_requires_published_at check \(publication_status <> 'published' or published_at is not null\)/);
    expect(migration).toMatch(/certifications_archived_requires_archived_at check \(publication_status <> 'archived' or archived_at is not null\)/);
    expect(migration).toMatch(/certifications_published_not_archived check \(publication_status <> 'published' or archived_at is null\)/);
    expect(migration).toMatch(/updated_by uuid references auth\.users\(id\)/);
  });

  it("adds RLS with admin-only policies and no delete access", () => {
    expect(migration).toContain("alter table public.certifications enable row level security;");
    expect(migration).toMatch(/create policy "admins select certifications" on public\.certifications\nfor select to authenticated using \(public\.is_admin\(\)\)/);
    expect(migration).toMatch(/create policy "admins insert certifications" on public\.certifications\nfor insert to authenticated with check \(public\.is_admin\(\)\)/);
    expect(migration).toMatch(/create policy "admins update certifications" on public\.certifications\nfor update to authenticated using \(public\.is_admin\(\)\) with check \(public\.is_admin\(\)\)/);
    expect(migration).not.toMatch(/create policy "admins delete certifications"/);
    expect(migration).not.toMatch(/grant delete on public\.certifications/);
    expect(migration).not.toMatch(/using \(true\)/);
  });

  it("creates the updated_at trigger and support indexes", () => {
    expect(migration).toContain("create or replace function public.set_updated_at()");
    expect(migration).toContain("create trigger certifications_set_updated_at");
    for (const index of ["certifications_publication_status_idx", "certifications_display_order_idx", "certifications_featured_idx", "certifications_recruiter_visible_idx", "certifications_category_idx", "certifications_completed_at_idx"]) {
      expect(migration).toContain(index);
    }
  });

  it("exposes a security definer RPC without updated_by and with minimal grants", () => {
    const rpc = migration.slice(migration.indexOf("create or replace function public.get_published_certifications"), migration.indexOf("revoke all on function"));
    expect(rpc).toContain("language sql stable security definer set search_path = public");
    expect(rpc).not.toContain("updated_by");
    expect(rpc).toMatch(/where c\.publication_status = 'published' and c\.archived_at is null/);
    expect(rpc).toMatch(/order by c\.display_order asc, c\.completed_at desc/);
    expect(migration).toContain("revoke all on function public.get_published_certifications() from public, anon, authenticated;");
    expect(migration).toContain("grant execute on function public.get_published_certifications() to anon, authenticated;");
  });

  it("configures the bucket idempotently and protects storage objects", () => {
    expect(migration).toMatch(/insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\)\nvalues \('certifications', 'certifications', true, 10485760, array\['application\/pdf'\]::text\[\]\)\non conflict \(id\) do update/);
    expect(migration).toMatch(/create policy "admins select certification files" on storage\.objects\nfor select to authenticated using \(bucket_id = 'certifications' and public\.is_admin\(\)\)/);
    expect(migration).toMatch(/create policy "admins insert certification files" on storage\.objects\nfor insert to authenticated with check \(bucket_id = 'certifications' and public\.is_admin\(\)\)/);
    expect(migration).toMatch(/create policy "admins update certification files" on storage\.objects\nfor update to authenticated using \(bucket_id = 'certifications' and public\.is_admin\(\)\) with check \(bucket_id = 'certifications' and public\.is_admin\(\)\)/);
    expect(migration).toMatch(/create policy "admins delete certification files" on storage\.objects\nfor delete to authenticated using \(bucket_id = 'certifications' and public\.is_admin\(\)\)/);
  });

  it("never seeds rows and never drops existing objects", () => {
    expect(migration).not.toMatch(/insert into public\.certifications/i);
    expect(migration).not.toMatch(/drop (table|function|view)/);
  });
});
