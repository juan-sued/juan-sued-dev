import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), publicClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.publicClient }));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

import { certificationCategoryLabel, certificationViews, getAdminCertificationById, getFeaturedCertifications, getPublishedCertifications, listAdminCertifications, listCertificationStorageFiles, type PublicCertificationDTO } from "../lib/repositories/certifications";

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

  it("maps published RPC rows to public DTOs with pdf_url via v2 RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    mocks.publicClient.mockReturnValue({
      from: vi.fn(),
      rpc,
      storage: { from: vi.fn(() => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }) })) },
    });
    const result = await getPublishedCertifications();
    expect(rpc).toHaveBeenCalledWith("get_published_certifications_v2");
    expect(result[0]).toMatchObject({ id, featured: true, recruiter_visible: true, pdf_url: `https://cdn.example/${row.storage_path}` });
    expect(result[0]).not.toHaveProperty("storage_path");
    expect(result[0]).not.toHaveProperty("updated_by");
  });

  it("preserves RPC order and returns the full published list", async () => {
    const node = { ...row, id: "00000000-0000-4000-8000-000000000002", title_pt: "Carreira Node.js: boas-vindas e primeiros passos", featured: false, display_order: 1 };
    mocks.publicClient.mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: [row, node], error: null }),
      storage: { from: vi.fn(() => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }) })) },
    });
    const result = await getPublishedCertifications();
    expect(result.map(item => item.title_pt)).toEqual(["SQL: explorando consultas e manipulação de dados", "Carreira Node.js: boas-vindas e primeiros passos"]);
  });

  it("returns an empty list when the RPC returns no rows", async () => {
    mocks.publicClient.mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      storage: { from: vi.fn(() => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }) })) },
    });
    await expect(getPublishedCertifications()).resolves.toEqual([]);
  });

  it("filters featured certifications from published ones", async () => {
    mocks.publicClient.mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: [{ ...row, featured: true }, { ...row, id: "00000000-0000-4000-8000-000000000002", featured: false }], error: null }),
      storage: { from: vi.fn(() => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }) })) },
    });
    const result = await getFeaturedCertifications();
    expect(result).toHaveLength(1);
    expect(result[0].featured).toBe(true);
  });
});

describe("certification views", () => {
  const dto: PublicCertificationDTO = {
    id: "00000000-0000-4000-8000-000000000001",
    title_pt: "SQL: explorando consultas e manipulação de dados",
    title_en: "SQL: Exploring Queries and Data Manipulation",
    issuer: "Alura",
    category: "database",
    completed_at: "2026-03-15",
    workload_hours: 14,
    skills: [],
    featured: true,
    recruiter_visible: true,
    display_order: 0,
    credential_url: null,
    pdf_url: "https://cdn.example/alura/2026/alura-sql.pdf",
  };

  it("localizes the title, category and exposes the pdf url without internal fields", () => {
    const [pt] = certificationViews([dto], { locale: "pt", recruiter: false });
    expect(pt).toMatchObject({ title: "SQL: explorando consultas e manipulação de dados", category: "Banco de Dados", pdfUrl: "https://cdn.example/alura/2026/alura-sql.pdf" });
    expect(pt).not.toHaveProperty("storage_path");
    expect(pt).not.toHaveProperty("recruiter_visible");
    expect(pt).not.toHaveProperty("publication_status");

    const [en] = certificationViews([dto], { locale: "en", recruiter: false });
    expect(en.title).toBe("SQL: Exploring Queries and Data Manipulation");
    expect(en.category).toBe("Database");
  });

  it("keeps all published certifications in normal mode regardless of recruiter_visible", () => {
    const hidden = { ...dto, id: "00000000-0000-4000-8000-000000000002", featured: false, recruiter_visible: false };
    const views = certificationViews([dto, hidden], { locale: "pt", recruiter: false });
    expect(views).toHaveLength(2);
  });

  it("filters recruiter_visible=false in recruiter mode", () => {
    const hidden = { ...dto, id: "00000000-0000-4000-8000-000000000002", featured: false, recruiter_visible: false };
    const views = certificationViews([dto, hidden], { locale: "pt", recruiter: true });
    expect(views).toHaveLength(1);
    expect(views[0].id).toBe(dto.id);
  });

  it("falls back to the Portuguese title when the English one is missing", () => {
    const [view] = certificationViews([{ ...dto, title_en: "" }], { locale: "en", recruiter: false });
    expect(view.title).toBe(dto.title_pt);
  });

  it("localizes known categories and falls back safely for future ones", () => {
    expect(certificationCategoryLabel("backend", "pt")).toBe("Back-end");
    expect(certificationCategoryLabel("backend", "en")).toBe("Back-end");
    expect(certificationCategoryLabel("database", "en")).toBe("Database");
    expect(certificationCategoryLabel("future_cat", "pt")).toBe("future_cat");
  });
});
