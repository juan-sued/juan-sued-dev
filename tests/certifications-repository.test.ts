import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { getAdminCertificationById, getFeaturedCertifications, getPublishedCertifications, listAdminCertifications, listCertificationStorageFiles } from "../lib/repositories/certifications";

const id = "00000000-0000-4000-8000-000000000001";

const row = {
  id,
  title_pt: "SQL: explorando consultas e manipulação de dados",
  title_en: "SQL: Exploring Queries and Data Manipulation",
  issuer: "Alura",
  category: "database",
  completed_at: "2026-03-15",
  workload_hours: 14,
  storage_bucket: "certifications",
  storage_path: "alura/2026/alura-sql-consultas-manipulacao-dados.pdf",
  credential_url: null,
  skills: [],
  featured: true,
  recruiter_visible: true,
  display_order: 0,
  publication_status: "published",
  published_at: "2026-08-05T00:00:00Z",
  archived_at: null,
  created_at: "2026-08-05T00:00:00Z",
  updated_at: "2026-08-05T00:00:00Z",
  updated_by: null,
};

afterEach(() => vi.clearAllMocks());

function table(result: unknown) {
  const query = {
    or: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: unknown) => void) => { resolve(result); },
  };
  const from = vi.fn(() => ({ select: vi.fn(() => query) }));
  const storage = {
    from: vi.fn(() => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }) })),
  };
  mocks.createClient.mockResolvedValue({ from, storage });
  return { from, storage };
}

describe("certifications repository", () => {
  it("lists admin certifications ordered and includes public URL", async () => {
    const db = table({ data: [row], error: null });
    const result = await listAdminCertifications();
    expect(db.from).toHaveBeenCalledWith("certifications");
    expect(result[0]).toMatchObject({ id, public_url: `https://cdn.example/${row.storage_path}` });
    expect(result[0].updated_by).toBeNull();
  });

  it("applies filters when provided", async () => {
    table({ data: [], error: null });
    await listAdminCertifications({ q: "alura", publication_status: "published", category: "database", featured: "true" });
  });

  it("loads a single certification by id or returns null", async () => {
    table({ data: row, error: null });
    await expect(getAdminCertificationById(id)).resolves.toMatchObject({ id, public_url: expect.stringContaining("https://") });
    table({ data: null, error: null });
    await expect(getAdminCertificationById(id)).resolves.toBeNull();
  });

  it("walks the storage bucket listing only files", async () => {
    const list = vi.fn((folder: string) => {
      const byFolder: Record<string, unknown[]> = {
        "": [{ name: "alura", metadata: null }],
        "alura": [{ name: "2026", metadata: null }],
        "alura/2026": [{ name: "b.pdf", metadata: { size: 2 } }, { name: "a.pdf", metadata: { size: 1 } }],
      };
      return Promise.resolve({ data: byFolder[folder] ?? [], error: null });
    });
    mocks.createClient.mockResolvedValue({ from: vi.fn(), storage: { from: vi.fn(() => ({ list })) } });
    await expect(listCertificationStorageFiles()).resolves.toEqual(["alura/2026/a.pdf", "alura/2026/b.pdf"]);
  });

  it("maps published RPC rows to public DTOs with pdf_url", async () => {
    mocks.createClient.mockResolvedValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: [row], error: null }),
      storage: { from: vi.fn(() => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }) })) },
    });
    const result = await getPublishedCertifications();
    expect(result[0]).toMatchObject({ id, featured: true, pdf_url: `https://cdn.example/${row.storage_path}` });
    expect(result[0]).not.toHaveProperty("storage_path");
    expect(result[0]).not.toHaveProperty("updated_by");
  });

  it("filters featured certifications from published ones", async () => {
    mocks.createClient.mockResolvedValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: [{ ...row, featured: true }, { ...row, id: "00000000-0000-4000-8000-000000000002", featured: false }], error: null }),
      storage: { from: vi.fn(() => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }) })) },
    });
    const result = await getFeaturedCertifications();
    expect(result).toHaveLength(1);
    expect(result[0].featured).toBe(true);
  });
});
