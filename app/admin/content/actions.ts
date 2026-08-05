"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult } from "@/lib/actions/action-result";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { type ContentType } from "./types";

export type { ContentType } from "./types";

const status = z.enum(["draft", "published", "archived"]);
const id = z.string().uuid();
const text = (max: number) => z.string().trim().min(1).max(max);
const integer = z.coerce.number().int().nonnegative();
const points = z.string().transform(value => value.split("\n").map(point => point.trim()).filter(Boolean)).pipe(z.array(text(1000)).min(1));
const schemas = {
  experiences: z.object({ company: text(160), role_pt: text(160), role_en: text(160), period_pt: text(100), period_en: text(100), points_pt: points, points_en: points, status, sort_order: integer }),
  skills: z.object({ category_pt: text(100), category_en: text(100), items: text(1000), status, sort_order: integer }),
  education: z.object({ institution: text(160), program_pt: text(200), program_en: text(200), detail_pt: text(1000), detail_en: text(1000), status, sort_order: integer }),
};

const invalid = (error: z.ZodError): ActionResult<never> => ({ ok: false, message: "Dados inválidos.", fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]> });
const failure = (message: string): ActionResult<never> => ({ ok: false, message });

export async function saveContent(type: ContentType, formData: FormData): Promise<ActionResult<{ id: string; path: string }>> {
  const admin = await requireAdmin();
  const parsed = schemas[type].safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const recordId = String(formData.get("id") ?? "");
  if (recordId && !id.safeParse(recordId).success) return failure("ID inválido.");
  const supabase = await createClient();
  const result = recordId
    ? await supabase.from(type).update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", recordId).select("id").maybeSingle()
    : await supabase.from(type).insert(parsed.data as never).select("id").single();
  if (result.error || !result.data) return failure("Não foi possível salvar conteúdo.");

  await audit(supabase, { actorId: admin.id, entityType: type, entityId: result.data.id, action: recordId ? "updated" : "created", changes: parsed.data });
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${type}`);
  revalidatePath(`/admin/content/${type}/${result.data.id}`);
  return { ok: true, data: { id: result.data.id, path: `/admin/content/${type}/${result.data.id}` }, message: "Conteúdo salvo." };
}
