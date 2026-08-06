import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase", "migrations", "20260805183921_add_get_published_certifications_v2.sql"), "utf8");

describe("certifications migration v2", () => {
  it("creates get_published_certifications_v2 with recruiter_visible in the return", () => {
    expect(migration).toContain("create or replace function public.get_published_certifications_v2()");
    expect(migration).toMatch(/recruiter_visible boolean,/);
  });

  it("selects columns explicitly and never uses select *", () => {
    const selectBlock = migration.slice(migration.indexOf("as $$"), migration.indexOf("$$;"));
    expect(selectBlock).not.toMatch(/select \*/i);
    expect(selectBlock).toContain("c.recruiter_visible");
  });

  it("only returns published, non-archived rows with deterministic order", () => {
    expect(migration).toMatch(/where c\.publication_status = 'published' and c\.archived_at is null/);
    expect(migration).toMatch(/order by c\.display_order asc, c\.completed_at desc/);
  });

  it("keeps the secure security definer model with a safe search_path", () => {
    expect(migration).toContain("language sql stable security definer set search_path = public");
  });

  it("grants only execute to public roles and never exposes table select", () => {
    expect(migration).toContain("revoke all on function public.get_published_certifications_v2() from public, anon, authenticated;");
    expect(migration).toContain("grant execute on function public.get_published_certifications_v2() to anon, authenticated;");
    expect(migration).not.toMatch(/grant select on public\.certifications/);
    expect(migration).not.toMatch(/enable row level security/);
  });

  it("is purely additive and does not touch the existing v1 RPC or schema", () => {
    expect(migration).not.toContain("get_published_certifications()");
    expect(migration).not.toMatch(/alter table/);
    expect(migration).not.toMatch(/create policy/);
    expect(migration).not.toMatch(/insert into storage\.buckets/);
    expect(migration).not.toMatch(/drop (table|function|view|policy|trigger)/);
  });
});
