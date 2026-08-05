"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { type ActionResult } from "@/lib/actions/action-result";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { certificationArchiveInputSchema, certificationAttachInputSchema, certificationDraftInputSchema, certificationPublishInputSchema, certificationReorderInputSchema, certificationRestoreInputSchema } from "@/lib/repositories/certifications";

const PDF_LIMIT = 10 * 1024 * 1024;
const NO_ENTITY_ID = "00000000-0000-4000-8000-000000000000";

type FieldErrors = Record<string, string[]>;
type UploadPdfResult = { ok: true; path: string } | { ok: false; message: string; fieldErrors?: FieldErrors };
const invalid = (error: z.ZodError): ActionResult<never> => ({ ok: false, message: "Dados inválidos.", fieldErrors: z.flattenError(error).fieldErrors as FieldErrors });
const failure = (message: string): ActionResult<never> => ({ ok: false, message });
const success = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, ...(message ? { message } : {}) });

function revalidateCertifications() {
  revalidatePath("/admin/content/certifications");
  updateTag("admin:certifications");
  updateTag("portfolio:certifications");
}

function revalidatePortfolioSummary() {
  updateTag("portfolio:home");
  updateTag("portfolio:about");
}

function normalizeSegment(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uploadPdf(supabase: Awaited<ReturnType<typeof createClient>>, formData: FormData): Promise<UploadPdfResult> {
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) return { ok: true, path: "" };
  if (file.type !== "application/pdf") return { ok: false, message: "Arquivo deve ser PDF.", fieldErrors: { pdf: ["O arquivo precisa ser um PDF."] } };
  if (!file.name.toLowerCase().endsWith(".pdf")) return { ok: false, message: "Arquivo deve terminar em .pdf.", fieldErrors: { pdf: ["O nome do arquivo precisa terminar em .pdf."] } };
  if (file.size > PDF_LIMIT) return { ok: false, message: "PDF excede o limite de 10 MB.", fieldErrors: { pdf: ["O arquivo deve ter no máximo 10 MB."] } };

  const buffer = new Uint8Array(await file.arrayBuffer());
  const signature = buffer.length >= 5 ? String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3], buffer[4]) : "";
  if (signature !== "%PDF-") return { ok: false, message: "O arquivo não é um PDF válido.", fieldErrors: { pdf: ["O conteúdo do arquivo não é um PDF válido."] } };

  const issuer = normalizeSegment(String(formData.get("issuer") ?? "")) || "certificado";
  const year = String(formData.get("completed_at") ?? "").slice(0, 4) || String(new Date().getFullYear());
  const short = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
  const path = `${issuer}/${year}/${issuer}-${short}.pdf`;

  const { error } = await supabase.storage.from("certifications").upload(path, file, { contentType: "application/pdf", upsert: false });
  if (error) return { ok: false, message: "Não foi possível enviar o PDF.", fieldErrors: { pdf: [error.message] } };
  return { ok: true, path };
}

async function saveCertification(formData: FormData): Promise<ActionResult<{ id: string; path: string }>> {
  const admin = await requireAdmin();
  const parsed = certificationDraftInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const uploaded = await uploadPdf(supabase, formData);
  if (!uploaded.ok) return uploaded;

  const storagePath = uploaded.path || parsed.data.storage_path;
  if (!storagePath) return { ok: false, message: "Selecione um PDF existente ou envie um novo.", fieldErrors: { pdf: ["PDF obrigatório."] } };

  const recordId = parsed.data.id;
  const payload = {
    title_pt: parsed.data.title_pt,
    title_en: parsed.data.title_en,
    issuer: parsed.data.issuer,
    category: parsed.data.category,
    completed_at: parsed.data.completed_at,
    workload_hours: parsed.data.workload_hours ?? null,
    credential_url: parsed.data.credential_url ?? null,
    skills: parsed.data.skills,
    featured: parsed.data.featured,
    recruiter_visible: parsed.data.recruiter_visible,
    display_order: parsed.data.display_order,
    storage_path: storagePath,
  };

  const result = recordId
    ? await supabase.from("certifications").update(payload).eq("id", recordId).select("id").maybeSingle()
    : await supabase.from("certifications").insert({ ...payload, publication_status: "draft" }).select("id").single();
  if (result.error || !result.data) return failure("Não foi possível salvar certificação.");

  await audit(supabase, { actorId: admin.id, entityType: "certification", entityId: result.data.id, action: recordId ? "cms_update" : "cms_create", changes: payload });
  revalidateCertifications();
  revalidatePortfolioSummary();
  return success({ id: result.data.id, path: `/admin/content/certifications/${result.data.id}` }, recordId ? "Certificação salva." : "Certificação criada como rascunho.");
}

export async function createCertificationDraft(formData: FormData): Promise<ActionResult<{ id: string; path: string }>> {
  return saveCertification(formData);
}

export async function updateCertification(formData: FormData): Promise<ActionResult<{ id: string; path: string }>> {
  return saveCertification(formData);
}

async function setPublicationStatus(formData: FormData, status: "published" | "draft" | "archived", restore: boolean): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = certificationPublishInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id } = parsed.data;
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase.from("certifications").select("id,title_en,publication_status").eq("id", id).maybeSingle();
  if (existingError) return failure("Não foi possível carregar certificação.");
  if (!existing) return failure("Certificação não encontrada.");
  if (status === "published" && !existing.title_en.trim()) return failure("Título em inglês é obrigatório para publicar.");

  const changes = status === "published" ? { publication_status: "published", published_at: new Date().toISOString(), archived_at: null }
    : status === "archived" ? { publication_status: "archived", archived_at: new Date().toISOString(), published_at: null }
    : restore ? { publication_status: "draft", archived_at: null, published_at: null }
    : { publication_status: "draft", published_at: null };

  const { error } = await supabase.from("certifications").update(changes).eq("id", id);
  if (error) return failure("Não foi possível atualizar a publicação.");

  await audit(supabase, { actorId: admin.id, entityType: "certification", entityId: id, action: status === "published" ? "cms_publish" : status === "archived" ? "cms_archive" : restore ? "cms_restore" : "cms_unpublish", changes });
  revalidateCertifications();
  revalidatePortfolioSummary();
  return success({ id }, status === "published" ? "Certificação publicada." : status === "archived" ? "Certificação arquivada." : restore ? "Certificação restaurada." : "Certificação despublicada.");
}

export async function publishCertification(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return setPublicationStatus(formData, "published", false);
}

export async function unpublishCertification(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return setPublicationStatus(formData, "draft", false);
}

export async function archiveCertification(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return setPublicationStatus(formData, "archived", false);
}

export async function restoreCertification(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return setPublicationStatus(formData, "draft", true);
}

export async function reorderCertifications(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = certificationReorderInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.from("certifications").update({ display_order: parsed.data.display_order }).eq("id", parsed.data.id).select("id").maybeSingle();
  if (error || !data) return failure("Não foi possível reordenar certificação.");
  await audit(supabase, { actorId: admin.id, entityType: "certification", entityId: parsed.data.id, action: "cms_reorder", changes: { display_order: parsed.data.display_order } });
  revalidateCertifications();
  return success({ id: parsed.data.id }, "Ordem atualizada.");
}

export async function uploadCertificationPdf(formData: FormData): Promise<ActionResult<{ storagePath: string }>> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const uploaded = await uploadPdf(supabase, formData);
  if (!uploaded.ok) return uploaded;
  await audit(supabase, { actorId: admin.id, entityType: "certification", entityId: NO_ENTITY_ID, action: "cms_file_upload", changes: { storage_path: uploaded.path } });
  revalidateCertifications();
  return success({ storagePath: uploaded.path }, "PDF enviado.");
}

export async function attachExistingCertificationPdf(formData: FormData): Promise<ActionResult<{ storagePath: string }>> {
  const admin = await requireAdmin();
  const parsed = certificationAttachInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.storage.from("certifications").info(parsed.data.storage_path);
  if (error) return failure("Arquivo não encontrado no bucket.");
  await audit(supabase, { actorId: admin.id, entityType: "certification", entityId: NO_ENTITY_ID, action: "cms_file_attach", changes: { storage_path: parsed.data.storage_path } });
  revalidateCertifications();
  return success({ storagePath: parsed.data.storage_path }, "PDF vinculado.");
}
