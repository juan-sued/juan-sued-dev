import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), createClient: vi.fn(), audit: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/audit", () => ({ audit: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { saveContent } from "../app/admin/content/actions";

const id = "11111111-1111-4111-8111-111111111111";
const form = (values: Record<string, string>) => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; };

type Query = { table: string; operation?: string; values?: unknown; filters: unknown[][] };

function database(results: Array<{ data?: unknown; error?: unknown }> = []) {
  const queries: Query[] = [];
  const from = vi.fn((table: string) => {
    const query: Query = { table, filters: [] };
    queries.push(query);
    const chain = {
      insert: (values: unknown) => { query.operation = "insert"; query.values = values; return chain; },
      update: (values: unknown) => { query.operation = "update"; query.values = values; return chain; },
      select: () => chain,
      eq: (...filter: unknown[]) => { query.filters.push(filter); return chain; },
      maybeSingle: async () => results.shift() ?? { data: null, error: null },
      single: async () => results.shift() ?? { data: null, error: null },
    };
    return chain;
  });
  return { client: { from }, queries };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin-id" });
  mocks.audit.mockResolvedValue(undefined);
  mocks.revalidatePath.mockResolvedValue(undefined);
});

const experienceForm = (overrides: Record<string, string> = {}) => form({
  company: "Acme", role_pt: "Dev", role_en: "Developer", period_pt: "2025", period_en: "2025",
  points_pt: "Entrega\nQualidade", points_en: "Ships\nQuality", status: "draft", sort_order: "0", ...overrides,
});

const skillForm = (overrides: Record<string, string> = {}) => form({
  category_pt: "Backend", category_en: "Backend", items: "Node.js, PostgreSQL", category: "backend", status: "draft", sort_order: "1", ...overrides,
});

const educationForm = (overrides: Record<string, string> = {}) => form({
  institution: "Uni", program_pt: "Computação", program_en: "Computer Science", detail_pt: "2025", detail_en: "2025", status: "draft", sort_order: "2", ...overrides,
});

describe("admin content actions", () => {
  it("rejects invalid input before touching the database", async () => {
    const result = await saveContent("experiences", form({ company: "" }));
    expect(result).toMatchObject({ ok: false, message: "Dados inválidos." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("mirrors legacy experience fields into the new CMS columns on insert", async () => {
    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(saveContent("experiences", experienceForm())).resolves.toMatchObject({ ok: true, data: { id, path: `/admin/content/experiences/${id}` } });

    expect(db.queries[0]).toMatchObject({ table: "experiences", operation: "insert" });
    expect(db.queries[0].values).toEqual(expect.objectContaining({
      publication_status: "draft",
      display_order: 0,
      responsibilities_pt: ["Entrega", "Qualidade"],
      responsibilities_en: ["Ships", "Quality"],
      recruiter_visible: true,
      published_at: null,
      archived_at: null,
    }));
  });

  it("sets published_at when saving with status published, and clears it when archived", async () => {
    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await saveContent("experiences", experienceForm({ status: "published" }));
    expect(db.queries[0].values).toEqual(expect.objectContaining({ publication_status: "published", published_at: expect.any(String), archived_at: null }));

    const db2 = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db2.client);
    await saveContent("experiences", experienceForm({ status: "archived" }));
    expect(db2.queries[0].values).toEqual(expect.objectContaining({ publication_status: "archived", published_at: null, archived_at: expect.any(String) }));
  });

  it("requires a valid skill category and writes it to the new column", async () => {
    const invalid = await saveContent("skills", skillForm({ category: "not-a-real-category" }));
    expect(invalid).toMatchObject({ ok: false, message: "Dados inválidos." });
    expect(mocks.createClient).not.toHaveBeenCalled();

    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);
    await expect(saveContent("skills", skillForm())).resolves.toMatchObject({ ok: true });
    expect(db.queries[0].values).toEqual(expect.objectContaining({ category: "backend", publication_status: "draft", display_order: 1 }));
  });

  it("mirrors legacy education fields into course_*/description_* columns", async () => {
    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(saveContent("education", educationForm())).resolves.toMatchObject({ ok: true });
    expect(db.queries[0].values).toEqual(expect.objectContaining({
      course_pt: "Computação", course_en: "Computer Science", description_pt: "2025", description_en: "2025", display_order: 2,
    }));
  });

  it("updates an existing record without including id in the payload", async () => {
    const db = database([{ data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(saveContent("experiences", experienceForm({ id }))).resolves.toMatchObject({ ok: true, data: { id } });
    expect(db.queries[0]).toMatchObject({ table: "experiences", operation: "update" });
    expect(db.queries[0].values).not.toHaveProperty("id");
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ entityType: "experiences", entityId: id, action: "updated" }));
  });
});
