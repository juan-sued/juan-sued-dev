import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const seed = readFileSync(resolve(process.cwd(), "supabase", "seed.sql"), "utf8");

describe("CMS1A seed", () => {
  it("seeds only portfolio CMS tables with stable, idempotent records", () => {
    expect(seed).toMatch(/insert into public\.(experiences|skills|education)/g);
    expect(seed.match(/insert into public\.(experiences|skills|education)/g)).toHaveLength(3);
    expect(seed).toMatch(/on conflict \(id\) do update set/g);
    expect(seed.match(/on conflict \(id\) do update set/g)).toHaveLength(3);
    expect(seed).not.toMatch(/crm|contact|opportunit|admin/i);
    expect(seed.match(/00000000-0000-4000-8000-\d{12}/g)).toHaveLength(11);
  });

  it("keeps CMS1A and legacy fields plus deterministic publication time", () => {
    for (const field of ["responsibilities_pt", "technologies", "display_order", "publication_status", "period_pt", "points_pt", "program_pt", "detail_pt"]) {
      expect(seed).toContain(field);
    }
    expect(seed).toContain("'2026-08-05T00:00:00Z'::timestamptz");
    expect(seed).toContain("array[]::text[]");
    expect(seed).toMatch(/start_date, end_date[\s\S]*null, null/);
    expect(seed.match(/'published'/g)).toHaveLength(22);
    expect(seed).not.toMatch(/'draft'|'archived'/);
    expect(seed).not.toMatch(/on conflict\s*\([^)]+\)\s*do nothing/i);
  });
});
