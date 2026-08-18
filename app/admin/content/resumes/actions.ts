"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { type ActionResult } from "@/lib/actions/action-result";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { resumeKindSchema } from "@/lib/repositories/resumes";
import { PORTFOLIO_RESUMES_TAG } from "@/lib/repositories/resumes-cache";

const PDF_LIMIT = 10 * 1024 * 1024;

const failure = (message: string): ActionResult<never> => ({ ok: false, message });
const success = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, ...(message ? { message } : {}) });

function revalidateResumes() {
  revalidatePath("/admin/content/resumes");
  updateTag(PORTFOLIO_RESUMES_TAG);
}

export async function uploadResume(formData: FormData): Promise<ActionResult<{ kind: string }>> {
  const admin = await requireAdmin();
  const parsedKind = resumeKindSchema.safeParse(formData.get("kind"));
  if (!parsedKind.success) return failure("Tipo de currículo inválido.");
  const kind = parsedKind.data;

  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) return failure("Selecione um arquivo PDF.");
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return failure("Arquivo deve ser um PDF.");
  if (file.size > PDF_LIMIT) return failure("PDF excede o limite de 10 MB.");

  const buffer = new Uint8Array(await file.arrayBuffer());
  const signature = buffer.length >= 5 ? String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3], buffer[4]) : "";
  if (signature !== "%PDF-") return failure("O arquivo não é um PDF válido.");

  const supabase = await createClient();
  const path = `${kind}.pdf`;
  const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, { contentType: "application/pdf", upsert: true });
  if (uploadError) return failure("Não foi possível enviar o PDF.");

  const { error } = await supabase.from("resumes").upsert({ kind, storage_path: path, updated_by: admin.id }, { onConflict: "kind" });
  if (error) return failure("Não foi possível registrar o currículo.");

  await audit(supabase, { actorId: admin.id, entityType: "resume", entityId: kind, action: "cms_file_upload", changes: { storage_path: path } });
  revalidateResumes();
  return success({ kind }, "Currículo atualizado.");
}

const resumeMetaSchema = z.object({ kind: resumeKindSchema, storage_path: z.string().nullable(), updated_at: z.string().nullable() });
export type ResumeMeta = z.infer<typeof resumeMetaSchema>;

export async function listAdminResumes(): Promise<ResumeMeta[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("resumes").select("kind,storage_path,updated_at");
  if (error) throw new Error(`Unable to list resumes: ${error.message}`);
  const byKind = new Map(resumeMetaSchema.array().parse(data ?? []).map(row => [row.kind, row]));
  return ["ats", "visual"].map(kind => byKind.get(kind as "ats" | "visual") ?? { kind: kind as "ats" | "visual", storage_path: null, updated_at: null });
}
