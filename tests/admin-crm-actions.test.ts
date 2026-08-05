import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), createClient: vi.fn(), audit: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/audit", () => ({ audit: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  archiveContact,
  closeOpportunity,
  convertContact,
  markContactAsSpam,
  reopenOpportunity,
  restoreContact,
  saveOpportunity,
  unlinkOpportunityContact,
  updateContact,
  updateOpportunityStatus,
} from "../app/admin/crm/actions";

const id = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const form = (values: Record<string, string>) => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; };

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
      maybeSingle: async () => results.shift() ?? { data: { id }, error: null },
      single: async () => results.shift() ?? { data: { id }, error: null },
    };
    return chain;
  });
  return { client: { from }, queries };
}

function expectContactRevalidated(contactId = id) {
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/crm/contacts");
  expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/crm/contacts/${contactId}`);
}

function expectOpportunityRevalidated(opportunityId = id) {
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
  expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/crm/opportunities");
  expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/crm/opportunities/${opportunityId}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin-id" });
  mocks.audit.mockResolvedValue(undefined);
});

describe("admin CRM actions", () => {
  it("rejects invalid and empty contact updates before database work", async () => {
    const invalid = await updateContact(form({ id: "not-a-uuid", status: "bad" }));
    const empty = await updateContact(form({ id }));

    expect(invalid).toMatchObject({ ok: false, message: "Dados inválidos.", fieldErrors: { id: expect.any(Array), status: expect.any(Array) } });
    expect(empty).toEqual({ ok: false, message: "Nenhuma alteração informada." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("saves contact note and mutation, then audits and revalidates", async () => {
    const db = database();
    mocks.createClient.mockResolvedValue(db.client);

    await expect(updateContact(form({ id, status: "contacted", nextActionAt: "2026-08-10", note: " Follow up " }))).resolves.toEqual({ ok: true, data: { id } });

    expect(db.queries).toHaveLength(2);
    expect(db.queries[0]).toMatchObject({ table: "contact_notes", operation: "insert", values: { contact_id: id, author_id: "admin-id", content: "Follow up" } });
    expect(db.queries[1].values).toEqual(expect.objectContaining({ status: "contacted", next_action_at: "2026-08-10" }));
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ entityType: "contact", entityId: id, action: "note_added" }));
    expectContactRevalidated();
  });

  it("does not audit or revalidate failed contact mutation", async () => {
    const db = database([{ data: null, error: { code: "fail" } }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(updateContact(form({ id, priority: "high" }))).resolves.toEqual({ ok: false, message: "Não foi possível atualizar contato." });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("validates opportunity fields and salary range before database work", async () => {
    const result = await saveOpportunity(form({ title: "X", status: "prospect", salary_min: "5000", salary_max: "1000", currency: "BR" }));

    expect(result).toMatchObject({ ok: false, message: "Dados inválidos.", fieldErrors: expect.objectContaining({ title: expect.any(Array), currency: expect.any(Array), salary_max: expect.any(Array) }) });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("creates opportunity and verifies linked contact before audit and revalidation", async () => {
    const db = database([{ data: { id: otherId }, error: null }, { data: { id }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(saveOpportunity(form({ title: "Platform Engineer", status: "screening", contact_id: otherId, salary_min: "1000", salary_max: "2000", currency: "USD" }))).resolves.toEqual({ ok: true, data: { id, path: `/admin/crm/opportunities/${id}` }, message: "Oportunidade salva." });
    expect(db.queries[0]).toMatchObject({ table: "contact_submissions", selected: "id" });
    expect(db.queries[1]).toMatchObject({ table: "opportunities", operation: "insert", values: expect.objectContaining({ contact_id: otherId, status: "screening", salary_min: 1000, salary_max: 2000 }) });
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ entityType: "opportunity", entityId: id, action: "created", changes: { status: "screening" } }));
    expectOpportunityRevalidated();
  });

  it("returns linked-contact and write errors without success side effects", async () => {
    const missingContact = database([{ data: null, error: null }]);
    mocks.createClient.mockResolvedValue(missingContact.client);
    await expect(saveOpportunity(form({ title: "Product Manager", status: "prospect", contact_id: otherId }))).resolves.toEqual({ ok: false, message: "Contato vinculado não encontrado." });

    const failedWrite = database([{ data: null, error: { code: "fail" } }]);
    mocks.createClient.mockResolvedValue(failedWrite.client);
    await expect(saveOpportunity(form({ id, title: "Product Manager", status: "prospect" }))).resolves.toEqual({ ok: false, message: "Não foi possível salvar oportunidade." });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns existing conversion without duplicate write, audit, or revalidation", async () => {
    const db = database([{ data: { id: otherId }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(convertContact(form({ id }))).resolves.toEqual({ ok: true, data: { id: otherId, path: `/admin/crm/opportunities/${otherId}` }, message: "Este contato já foi convertido em uma oportunidade." });
    expect(db.queries).toHaveLength(1);
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("safely returns competing duplicate conversion", async () => {
    const db = database([{ data: null, error: null }, { data: { company: "Acme", subject: "Role" }, error: null }, { data: null, error: { code: "23505" } }, { data: { id: otherId }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(convertContact(form({ id }))).resolves.toEqual({ ok: true, data: { id: otherId, path: `/admin/crm/opportunities/${otherId}` }, message: "Este contato já foi convertido em uma oportunidade." });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("converts contact, audits, and revalidates both entities only after success", async () => {
    const db = database([{ data: null, error: null }, { data: { company: "Acme", subject: "Staff Engineer" }, error: null }, { data: { id: otherId }, error: null }]);
    mocks.createClient.mockResolvedValue(db.client);

    await expect(convertContact(form({ id }))).resolves.toMatchObject({ ok: true, data: { id: otherId } });
    expect(db.queries[2]).toMatchObject({ table: "opportunities", operation: "insert", values: { contact_id: id, title: "Staff Engineer", company_name: "Acme", status: "prospect" } });
    expect(mocks.audit).toHaveBeenCalledWith(db.client, expect.objectContaining({ entityType: "contact", entityId: id, action: "converted", changes: { opportunity_id: otherId } }));
    expectContactRevalidated();
    expectOpportunityRevalidated(otherId);
  });

  it("archives, restores, and marks spam with correct audit actions", async () => {
    const db = database();
    mocks.createClient.mockResolvedValue(db.client);

    await archiveContact(form({ id }));
    await restoreContact(form({ id }));
    await markContactAsSpam(form({ id }));

    expect(db.queries.map(query => query.values)).toEqual([expect.objectContaining({ archived_at: expect.any(String) }), expect.objectContaining({ archived_at: null }), expect.objectContaining({ status: "spam" })]);
    expect(mocks.audit.mock.calls.map(([, entry]) => entry.action)).toEqual(["archived", "restored", "marked_spam"]);
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(9);
  });

  it("updates opportunity status and keeps failed status write side-effect free", async () => {
    const successDb = database();
    mocks.createClient.mockResolvedValue(successDb.client);
    await expect(updateOpportunityStatus(form({ id, status: "offer" }))).resolves.toEqual({ ok: true, data: { id } });
    expect(successDb.queries[0].values).toEqual(expect.objectContaining({ status: "offer" }));
    expectOpportunityRevalidated();

    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-id" });
    const failedDb = database([{ data: null, error: { code: "fail" } }]);
    mocks.createClient.mockResolvedValue(failedDb.client);
    await expect(updateOpportunityStatus(form({ id, status: "not-valid" }))).resolves.toMatchObject({ ok: false, message: "Dados inválidos." });
    await expect(updateOpportunityStatus(form({ id, status: "offer" }))).resolves.toEqual({ ok: false, message: "Não foi possível atualizar status da oportunidade." });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("closes, reopens, and unlinks opportunity with matching audit changes", async () => {
    const db = database();
    mocks.createClient.mockResolvedValue(db.client);

    await closeOpportunity(form({ id }));
    await reopenOpportunity(form({ id }));
    await unlinkOpportunityContact(form({ id }));

    expect(db.queries.map(query => query.values)).toEqual([expect.objectContaining({ closed_at: expect.any(String) }), expect.objectContaining({ closed_at: null }), expect.objectContaining({ contact_id: null })]);
    expect(mocks.audit.mock.calls.map(([, entry]) => [entry.action, entry.changes])).toEqual([["closed", { closed: true }], ["reopened", { closed: false }], ["contact_unlinked", { contact_id: null }]]);
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(9);
  });
});
