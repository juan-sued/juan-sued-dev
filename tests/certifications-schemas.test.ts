import { describe, expect, it } from "vitest";
import { certificationArchiveInputSchema, certificationAttachInputSchema, certificationDraftInputSchema, certificationPublishInputSchema, certificationReorderInputSchema, certificationRestoreInputSchema, certificationRowSchema, certificationStoragePathSchema, certificationUploadInputSchema } from "../lib/repositories/certifications";

const uuid = "00000000-0000-4000-8000-000000000001";

describe("certification schemas", () => {
  it("accepts only safe, relative, .pdf storage paths", () => {
    expect(certificationStoragePathSchema.safeParse("alura/2026/alura-sql-consultas-manipulacao-dados.pdf").success).toBe(true);
    expect(certificationStoragePathSchema.safeParse("/leading.pdf").success).toBe(false);
    expect(certificationStoragePathSchema.safeParse("folder/../up.pdf").success).toBe(false);
    expect(certificationStoragePathSchema.safeParse("file.txt").success).toBe(false);
    expect(certificationStoragePathSchema.safeParse("https://cdn.example/a.pdf").success).toBe(false);
    expect(certificationStoragePathSchema.safeParse("a/b.pdf?query=1").success).toBe(false);
    expect(certificationStoragePathSchema.safeParse("C:\\a.pdf").success).toBe(false);
  });

  it("parses a complete draft input and coerces form values", () => {
    const result = certificationDraftInputSchema.safeParse({
      title_pt: "SQL", title_en: "SQL", issuer: "Alura", category: "database",
      completed_at: "2026-03-15", workload_hours: "14", storage_path: "alura/2026/a.pdf",
      credential_url: "https://example.com/cred", skills: "SQL\nJoins", featured: "on",
      recruiter_visible: "on", display_order: "0",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.featured).toBe(true);
    expect(result.data.recruiter_visible).toBe(true);
    expect(result.data.skills).toEqual(["SQL", "Joins"]);
    expect(result.data.workload_hours).toBe(14);
    expect(result.data.publication_status).toBe("draft");
  });

  it("rejects invalid drafts with field errors", () => {
    const missingTitle = certificationDraftInputSchema.safeParse({ category: "database", completed_at: "2026-03-15" });
    expect(missingTitle.success).toBe(false);
    const httpUrl = certificationDraftInputSchema.safeParse({ title_pt: "A", title_en: "A", issuer: "X", category: "database", completed_at: "2026-03-15", storage_path: "a.pdf", credential_url: "http://example.com", skills: "", featured: false, recruiter_visible: false, display_order: 0 });
    expect(httpUrl.success).toBe(false);
    const badCategory = certificationDraftInputSchema.safeParse({ title_pt: "A", title_en: "A", issuer: "X", category: "science", completed_at: "2026-03-15", storage_path: "a.pdf", skills: "", featured: false, recruiter_visible: false, display_order: 0 });
    expect(badCategory.success).toBe(false);
  });

  it("accepts empty optional fields as missing values", () => {
    const result = certificationDraftInputSchema.safeParse({
      title_pt: "A", title_en: "A", issuer: "X", category: "backend", completed_at: "2026-03-15",
      workload_hours: "", storage_path: "", credential_url: "", skills: "", featured: false,
      recruiter_visible: false, display_order: 0,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.workload_hours).toBeUndefined();
    expect(result.data.storage_path).toBeUndefined();
    expect(result.data.credential_url).toBeUndefined();
  });

  it("validates status transition and ordering inputs", () => {
    expect(certificationPublishInputSchema.safeParse({ id: uuid }).success).toBe(true);
    expect(certificationPublishInputSchema.safeParse({ id: "nope" }).success).toBe(false);
    expect(certificationReorderInputSchema.safeParse({ id: uuid, display_order: "2" }).success).toBe(true);
    expect(certificationReorderInputSchema.safeParse({ id: uuid, display_order: "-1" }).success).toBe(false);
    expect(certificationArchiveInputSchema.safeParse({ id: uuid }).success).toBe(true);
    expect(certificationRestoreInputSchema.safeParse({ id: uuid }).success).toBe(true);
    expect(certificationArchiveInputSchema.safeParse({}).success).toBe(false);
    expect(certificationRestoreInputSchema.safeParse({}).success).toBe(false);
  });

  it("validates attach and upload inputs", () => {
    expect(certificationAttachInputSchema.safeParse({ storage_path: "alura/2026/a.pdf" }).success).toBe(true);
    expect(certificationAttachInputSchema.safeParse({ storage_path: "../x.pdf" }).success).toBe(false);
    expect(certificationUploadInputSchema.safeParse({ file: new File(["%PDF-"], "a.pdf", { type: "application/pdf" }) }).success).toBe(true);
    expect(certificationUploadInputSchema.safeParse({ file: "not-a-file" }).success).toBe(false);
  });

  it("parses a full database row including updated_by", () => {
    const row = {
      id: uuid, title_pt: "SQL", title_en: "SQL", issuer: "Alura", category: "database",
      completed_at: "2026-03-15", workload_hours: 14, storage_bucket: "certifications",
      storage_path: "alura/2026/a.pdf", credential_url: null, skills: [], featured: true,
      recruiter_visible: true, display_order: 0, publication_status: "published",
      published_at: "2026-08-05T00:00:00Z", archived_at: null,
      created_at: "2026-08-05T00:00:00Z", updated_at: "2026-08-05T00:00:00Z", updated_by: null,
    };
    expect(certificationRowSchema.safeParse(row).success).toBe(true);
    expect(certificationRowSchema.safeParse({ ...row, storage_path: "bad" }).success).toBe(false);
  });
});
