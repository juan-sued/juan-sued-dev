"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveContent } from "@/app/admin/content/actions";
import { type ContentType } from "@/app/admin/content/types";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import { type ActionResult } from "@/lib/actions/action-result";

type RecordValue = Record<string, string | number | string[] | null | undefined>;
type Result = ActionResult<{ id: string; path: string }> | null;
const fields: Record<ContentType, { name: string; label: string; area?: boolean }[]> = {
  experiences: [{ name: "company", label: "Empresa" }, { name: "role_pt", label: "Cargo (PT)" }, { name: "role_en", label: "Cargo (EN)" }, { name: "period_pt", label: "Período (PT)" }, { name: "period_en", label: "Período (EN)" }, { name: "points_pt", label: "Pontos (PT, um por linha)", area: true }, { name: "points_en", label: "Pontos (EN, um por linha)", area: true }],
  skills: [{ name: "category_pt", label: "Categoria (PT)" }, { name: "category_en", label: "Categoria (EN)" }, { name: "items", label: "Itens", area: true }],
  education: [{ name: "institution", label: "Instituição" }, { name: "program_pt", label: "Programa (PT)" }, { name: "program_en", label: "Programa (EN)" }, { name: "detail_pt", label: "Detalhe (PT)", area: true }, { name: "detail_en", label: "Detalhe (EN)", area: true }],
};

export function ContentForm({ type, record }: { type: ContentType; record?: RecordValue }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [result, formAction] = useActionState<Result, FormData>((_previous, formData) => saveContent(type, formData), null);
  const value = (name: string) => { const entry = record?.[name]; return Array.isArray(entry) ? entry.join("\n") : String(entry ?? ""); };
  useEffect(() => {
    if (!result) return;
    if (!result.ok) { toast.error(result.message); const name = Object.keys(result.fieldErrors ?? {})[0]; const field = name && formRef.current?.elements.namedItem(name); if (field instanceof HTMLElement) field.focus(); return; }
    toast.success(result.message); startTransition(() => router.push(result.data.path));
  }, [result, router]);

  return <form ref={formRef} action={formAction} className="mt-6 grid max-w-3xl gap-4"><ActionFeedback result={result}/><input type="hidden" name="id" value={value("id")}/>{fields[type].map(field => <label key={field.name} className="grid gap-1 text-sm font-semibold">{field.label}{field.area ? <textarea name={field.name} defaultValue={value(field.name)} required aria-invalid={Boolean(result && !result.ok && result.fieldErrors?.[field.name])} className="min-h-28 rounded-lg border border-[var(--line)] bg-transparent p-3"/> : <input name={field.name} defaultValue={value(field.name)} required aria-invalid={Boolean(result && !result.ok && result.fieldErrors?.[field.name])} className="rounded-lg border border-[var(--line)] bg-transparent p-3"/>}{result && !result.ok && result.fieldErrors?.[field.name]?.[0] && <span className="text-sm font-normal text-red-600">{result.fieldErrors[field.name][0]}</span>}</label>)}<div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Status<select name="status" defaultValue={value("status") || "draft"} className="rounded-lg border border-[var(--line)] bg-transparent p-3"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label><label className="grid gap-1 text-sm font-semibold">Ordem<input name="sort_order" type="number" min="0" defaultValue={value("sort_order") || "0"} required className="rounded-lg border border-[var(--line)] bg-transparent p-3"/></label></div><SubmitButton className="w-fit" pendingChildren="Salvando...">{record ? "Salvar conteúdo" : "Criar conteúdo"}</SubmitButton></form>;
}
