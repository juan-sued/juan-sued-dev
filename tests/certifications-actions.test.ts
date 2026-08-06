import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), createClient: vi.fn(), audit: vi.fn(), revalidatePath: vi.fn(), updateTag: vi.fn() }));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/audit", () => ({ audit: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath, updateTag: mocks.updateTag }));

import { archiveCertification, attachExistingCertificationPdf, createCertificationDraft, publishCertification, reorderCertifications, restoreCertification, unpublishCertification, updateCertification, uploadCertificationPdf } from "../app/admin/content/certifications/actions";

const id = "11111111-1111-4111-8111-111111111111";
const form = (values: Record<string, string>) => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; };

const draftForm = () => form({
  title_pt: "SQL: explorando consultas e manipulação de dados",
  title_en: "SQL: Exploring Queries and Data Manipulation",
  issuer: "Alura",
  category: "database",
  completed_at: "2026-03-15",
  workload_hours: "14",
  storage_path: "alura/2026/alura-sql-consultas-manipulacao-dados.pdf",
  credential_url: "",
  skills: "SQL\nJoins",
  featured: "on",
  recruiter_visible: "on",
  display_order: "0",
});

type Query = { table: string; operation?: string; values?: unknown; filters: unknown[][]; selected?: string };

function database(results: Array<{ data?: unknown; error?: unknown }> = []) {
  const queries: Query[] = [];
  const from = vi.fn((table: string) => {
    const query: Query = { table, filters: [] };
    queries.push(query);
    const chain = {
      insert: (values: unknown) => { query.operation = "insert"; query.values = values; return chain; },
      update: (values: unknown) => { query.operation = "update"; query.values = values; return chain; },
      select: (selected: string) => { query.selected = selected; return chain; },
      eq: (...filter: unknown[]) => { query.filters.push(filter); return chain; },
      maybeSingle: async () => results.shift() ?? { data: null, error: null },
      single: async () => results.shift() ?? { data: null, error: null },
    };
    return chain;
  });
  return { client: { from }, queries };
}

function expectTagsRevalidated() {
  expect(mocks.updateTag).toHaveBeenCalledWith("admin:certifications");
  expect(mocks.updateTag).toHaveBeenCalledWith("portfolio:certifications");
}

function expectSummaryRevalidated() {
  expectTagsRevalidated();
  expect(mocks.updateTag).toHaveBeenCalledWith("portfolio:home");
  expect(mocks.updateTag).toHaveBeenCalledWith("portfolio:about");
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin-id" });
  mocks.audit.mockResolvedValue(undefined);
  mocks.updateTag.mockResolvedValue(undefined);
  mocks.revalidatePath.mockResolvedValue(undefined);
});

describe("admin certifications actions", () => {
  it("rejects invalid input before touching the database", async () => {
    const result = await createCertificationDraft(form({ title_pt: "X", issuer: "Alura", category: "nope" }));
    expect(result).toMatchObject({ ok: false, message: "Dados inválidos." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("creates a draft with all content fields and audits", async () => {
    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(createCertificationDraft(draftForm())).resolves.toMatchObject({ ok: true, data: { id, path: `/admin/content/certifications/${id}` } });

    expect(db.queries).toHaveLength(1);
    expect(db.queries[0]).toMatchObject({ table: "certifications", operation: "insert" });
    expect(db.queries[0].values).toEqual(expect.objectContaining({ title_pt: expect.any(String), storage_path: "alura/2026/alura-sql-consultas-manipulacao-dados.pdf", publication_status: "draft", featured: true, skills: ["SQL", "Joins"] }));
    expect(db.queries[0].values).not.toHaveProperty("id");
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ entityType: "certification", entityId: id, action: "cms_create" }));
    expectSummaryRevalidated();
  });

  it("updates content without touching publication status", async () => {
    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(updateCertification(form({ ...Object.fromEntries(draftForm()), id }))).resolves.toMatchObject({ ok: true, data: { id, path: `/admin/content/certifications/${id}` } });

    expect(db.queries[0]).toMatchObject({ table: "certifications", operation: "update", values: expect.not.objectContaining({ publication_status: expect.anything(), id: expect.anything() }) });
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ entityId: id, action: "cms_update" }));
  });

  it("requires a pdf when neither file nor storage_path are provided", async () => {
    const db = database();
    mocks.createClient.mockResolvedValue(db.client);
    const empty = draftForm();
    empty.delete("storage_path");

    const result = await createCertificationDraft(empty);
    expect(result).toMatchObject({ ok: false, fieldErrors: { pdf: expect.any(Array) } });
    expect(db.queries).toHaveLength(0);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("publishes only when title_en exists, then audits and revalidates", async () => {
    const db = database([{ data: { id, title_en: "SQL", publication_status: "draft" }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(publishCertification(form({ id }))).resolves.toEqual({ ok: true, data: { id }, message: "Certificação publicada." });
    expect(db.queries[1]).toMatchObject({ table: "certifications", operation: "update", values: expect.objectContaining({ publication_status: "published", published_at: expect.any(String), archived_at: null }) });
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ entityId: id, action: "cms_publish" }));
    expectSummaryRevalidated();
  });

  it("refuses to publish a certification without an English title", async () => {
    const db = database([{ data: { id, title_en: "   ", publication_status: "draft" }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(publishCertification(form({ id }))).resolves.toEqual({ ok: false, message: "Título em inglês é obrigatório para publicar." });
    expect(db.queries).toHaveLength(1);
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("unpublishes, archives, and restores with matching audit actions", async () => {
    const db = database([{ data: { id, title_en: "X", publication_status: "published" }, error: null }, { data: { id, title_en: "X", publication_status: "published" }, error: null }, { data: { id, title_en: "X", publication_status: "archived" }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await unpublishCertification(form({ id }));
    await archiveCertification(form({ id }));
    await restoreCertification(form({ id }));

    expect(db.queries.filter(q => q.table === "certifications" && q.operation === "update").map(q => q.values)).toEqual([
      expect.objectContaining({ publication_status: "draft", published_at: null }),
      expect.objectContaining({ publication_status: "archived", archived_at: expect.any(String), published_at: null }),
      expect.objectContaining({ publication_status: "draft", archived_at: null }),
    ]);
    expect(mocks.audit.mock.calls.map(([, entry]) => entry.action)).toEqual(["cms_unpublish", "cms_archive", "cms_restore"]);
  });

  it("reorders a certification", async () => {
    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(reorderCertifications(form({ id, display_order: "3" }))).resolves.toMatchObject({ ok: true, data: { id } });
    expect(db.queries[0].values).toEqual(expect.objectContaining({ display_order: 3 }));
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ action: "cms_reorder", changes: { display_order: 3 } }));
    expectTagsRevalidated();
  });

  it("uploads a validated pdf to a generated safe path", async () => {
    const file = new File(["%PDF-1.7 fake"], "certificado.pdf", { type: "application/pdf" });
    const data = new FormData();
    data.set("pdf", file);
    data.set("issuer", "Alura");
    data.set("completed_at", "2026-03-15");
    const upload = vi.fn().mockResolvedValue({ data: { path: "alura/2026/alura-abcdef12.pdf" }, error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(), storage: { from: vi.fn(() => ({ upload })) } });

    const result = await uploadCertificationPdf(data);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.storagePath).toMatch(/^alura\/2026\/alura-[a-f0-9]{8}\.pdf$/);
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^alura\/2026\/alura-[a-f0-9]{8}\.pdf$/), expect.any(File), expect.objectContaining({ contentType: "application/pdf" }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: "cms_file_upload" }));
  });

  it("rejects non-pdf and oversized uploads before storage", async () => {
    const text = new File(["hello"], "a.txt", { type: "text/plain" });
    const data = new FormData();
    data.set("pdf", text);
    mocks.createClient.mockResolvedValue({ from: vi.fn(), storage: { from: vi.fn(() => ({ upload: vi.fn() })) } });

    const result = await uploadCertificationPdf(data);
    expect(result).toMatchObject({ ok: false, fieldErrors: { pdf: expect.any(Array) } });
  });

  it("attaches an existing pdf that exists in the bucket", async () => {
    const info = vi.fn().mockResolvedValue({ data: {}, error: null });
    mocks.createClient.mockResolvedValue({ from: vi.fn(), storage: { from: vi.fn(() => ({ info })) } });

    await expect(attachExistingCertificationPdf(form({ storage_path: "alura/2026/alura-sql-consultas-manipulacao-dados.pdf" }))).resolves.toMatchObject({ ok: true, data: { storagePath: "alura/2026/alura-sql-consultas-manipulacao-dados.pdf" } });
    expect(mocks.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: "cms_file_attach" }));
  });

  it("rejects attaching a path missing from the bucket", async () => {
    const info = vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
    mocks.createClient.mockResolvedValue({ from: vi.fn(), storage: { from: vi.fn(() => ({ info })) } });

    await expect(attachExistingCertificationPdf(form({ storage_path: "alura/2026/missing.pdf" }))).resolves.toEqual({ ok: false, message: "Arquivo não encontrado no bucket." });
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
