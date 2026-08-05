"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult } from "@/lib/actions/action-result";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const contactStatuses = ["new", "reviewing", "contacted", "opportunity", "interview", "proposal", "hired", "closed", "spam"] as const;
const opportunityStatuses = ["prospect", "applied", "recruiter_contact", "screening", "technical_interview", "final_interview", "offer", "hired", "rejected", "withdrawn"] as const;
const idSchema = z.object({ id: z.string().uuid() });
const contactUpdate = z.object({ id: z.string().uuid(), status: z.enum(contactStatuses).optional(), priority: z.enum(["low", "normal", "high", "urgent"]).optional(), nextActionAt: z.string().max(40).optional(), note: z.string().trim().min(1).max(5000).optional() });
const blank = z.preprocess(value => value === "" ? undefined : value, z.string().optional());
const optionalNumber = z.preprocess(value => value === "" ? undefined : value, z.coerce.number().nonnegative().optional());
const optionalDate = z.preprocess(value => value === "" ? undefined : value, z.string().refine(value => !Number.isNaN(Date.parse(value))).optional());
const opportunity = z.object({ id: blank.pipe(z.string().uuid().optional()), title: z.string().trim().min(2).max(180), company_name: blank.pipe(z.string().trim().max(180).optional()), employment_type: blank.pipe(z.string().trim().max(80).optional()), work_model: blank.pipe(z.string().trim().max(80).optional()), salary_min: optionalNumber, salary_max: optionalNumber, currency: z.string().trim().length(3).default("BRL"), status: z.enum(opportunityStatuses), contact_id: blank.pipe(z.string().uuid().optional()), source: blank.pipe(z.string().trim().max(180).optional()), job_url: blank.pipe(z.url().optional()), next_action_at: optionalDate, interview_at: optionalDate, closed_at: optionalDate, notes: blank.pipe(z.string().max(5000).optional()) }).refine(x => x.salary_max === undefined || x.salary_min === undefined || x.salary_max >= x.salary_min, { message: "Faixa salarial inválida", path: ["salary_max"] });

type FieldErrors = Record<string, string[]>;
const invalid = (error: z.ZodError): ActionResult<never> => ({ ok: false, message: "Dados inválidos.", fieldErrors: z.flattenError(error).fieldErrors as FieldErrors });
const failure = (message: string): ActionResult<never> => ({ ok: false, message });
const success = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, ...(message ? { message } : {}) });

function revalidateContact(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/crm/contacts");
  revalidatePath(`/admin/crm/contacts/${id}`);
}

function revalidateOpportunity(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/crm/opportunities");
  revalidatePath(`/admin/crm/opportunities/${id}`);
}

export async function updateContact(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = contactUpdate.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, note, nextActionAt, ...changes } = parsed.data;
  if (!note && !Object.keys(changes).length && nextActionAt === undefined) return failure("Nenhuma alteração informada.");
  const supabase = await createClient();

  if (note) {
    const { error } = await supabase.from("contact_notes").insert({ contact_id: id, author_id: admin.id, content: note });
    if (error) return failure("Não foi possível adicionar nota.");
  }
  if (Object.keys(changes).length || nextActionAt !== undefined) {
    const { data, error } = await supabase.from("contact_submissions").update({ ...changes, next_action_at: nextActionAt || null, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
    if (error || !data) return failure("Não foi possível atualizar contato.");
  }

  await audit(supabase, { actorId: admin.id, entityType: "contact", entityId: id, action: note ? "note_added" : "updated", changes });
  revalidateContact(id);
  return success({ id });
}

export async function saveOpportunity(formData: FormData): Promise<ActionResult<{ id: string; path: string }>> {
  const admin = await requireAdmin();
  const parsed = opportunity.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  if (values.contact_id) {
    const { data: contact, error } = await supabase.from("contact_submissions").select("id").eq("id", values.contact_id).maybeSingle();
    if (error || !contact) return failure("Contato vinculado não encontrado.");
  }
  const data = { ...values, contact_id: values.contact_id || null, next_action_at: values.next_action_at || null, interview_at: values.interview_at || null, closed_at: values.closed_at || null };
  const result = id ? await supabase.from("opportunities").update(data).eq("id", id).select("id").single() : await supabase.from("opportunities").insert(data).select("id").single();
  if (result.error || !result.data) return failure("Não foi possível salvar oportunidade.");

  await audit(supabase, { actorId: admin.id, entityType: "opportunity", entityId: result.data.id, action: id ? "updated" : "created", changes: { status: data.status } });
  revalidateOpportunity(result.data.id);
  return success({ id: result.data.id, path: `/admin/crm/opportunities/${result.data.id}` }, "Oportunidade salva.");
}

export async function convertContact(formData: FormData): Promise<ActionResult<{ id: string; path: string }>> {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id } = parsed.data;
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase.from("opportunities").select("id").eq("contact_id", id).maybeSingle();
  if (existingError) return failure("Não foi possível verificar oportunidade existente.");
  if (existing) return success({ id: existing.id, path: `/admin/crm/opportunities/${existing.id}` }, "Este contato já foi convertido em uma oportunidade.");

  const { data: contact, error: contactError } = await supabase.from("contact_submissions").select("company, subject").eq("id", id).maybeSingle();
  if (contactError || !contact) return failure("Contato não encontrado.");
  const result = await supabase.from("opportunities").insert({ contact_id: id, title: contact.subject || "Oportunidade", company_name: contact.company || null, status: "prospect" }).select("id").single();
  if (result.error || !result.data) {
    if (result.error?.code === "23505") {
      const { data: duplicate } = await supabase.from("opportunities").select("id").eq("contact_id", id).maybeSingle();
      if (duplicate) return success({ id: duplicate.id, path: `/admin/crm/opportunities/${duplicate.id}` }, "Este contato já foi convertido em uma oportunidade.");
    }
    return failure("Não foi possível converter contato.");
  }

  await audit(supabase, { actorId: admin.id, entityType: "contact", entityId: id, action: "converted", changes: { opportunity_id: result.data.id } });
  revalidateContact(id);
  revalidateOpportunity(result.data.id);
  return success({ id: result.data.id, path: `/admin/crm/opportunities/${result.data.id}` });
}

async function setContactArchive(formData: FormData, archived: boolean): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("contact_submissions").update({ archived_at: archived ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return failure(`Não foi possível ${archived ? "arquivar" : "restaurar"} contato.`);
  await audit(supabase, { actorId: admin.id, entityType: "contact", entityId: id, action: archived ? "archived" : "restored" });
  revalidateContact(id);
  return success({ id });
}

export async function archiveContact(formData: FormData) { return setContactArchive(formData, true); }
export async function restoreContact(formData: FormData) { return setContactArchive(formData, false); }

export async function markContactAsSpam(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("contact_submissions").update({ status: "spam", updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return failure("Não foi possível marcar contato como spam.");
  await audit(supabase, { actorId: admin.id, entityType: "contact", entityId: id, action: "marked_spam", changes: { status: "spam" } });
  revalidateContact(id);
  return success({ id });
}

export async function updateOpportunityStatus(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(opportunityStatuses) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities").update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq("id", parsed.data.id).select("id").maybeSingle();
  if (error || !data) return failure("Não foi possível atualizar status da oportunidade.");
  await audit(supabase, { actorId: admin.id, entityType: "opportunity", entityId: parsed.data.id, action: "status_updated", changes: { status: parsed.data.status } });
  revalidateOpportunity(parsed.data.id);
  return success({ id: parsed.data.id });
}

async function setOpportunityClosed(formData: FormData, closed: boolean): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities").update({ closed_at: closed ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return failure(`Não foi possível ${closed ? "fechar" : "reabrir"} oportunidade.`);
  await audit(supabase, { actorId: admin.id, entityType: "opportunity", entityId: id, action: closed ? "closed" : "reopened", changes: { closed } });
  revalidateOpportunity(id);
  return success({ id });
}

export async function closeOpportunity(formData: FormData) { return setOpportunityClosed(formData, true); }
export async function reopenOpportunity(formData: FormData) { return setOpportunityClosed(formData, false); }

export async function unlinkOpportunityContact(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("opportunities").update({ contact_id: null, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return failure("Não foi possível desvincular contato.");
  await audit(supabase, { actorId: admin.id, entityType: "opportunity", entityId: id, action: "contact_unlinked", changes: { contact_id: null } });
  revalidateOpportunity(id);
  return success({ id });
}
