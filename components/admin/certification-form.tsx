"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCertificationDraft, updateCertification } from "@/app/admin/content/certifications/actions";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import { type ActionResult } from "@/lib/actions/action-result";

const categories = ["frontend", "backend", "database", "mobile", "cloud", "devops", "architecture", "quality", "general"];
type CertificationRecord = Record<string, string | number | boolean | string[] | null | undefined>;
type Result = ActionResult<{ id: string; path: string }> | null;

export function CertificationForm({ certification, existingFiles }: { certification?: CertificationRecord; existingFiles: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [result, formAction] = useActionState<Result, FormData>(
    async (_previous, formData) => certification ? updateCertification(formData) : createCertificationDraft(formData),
    null,
  );
  const value = (key: string) => { const entry = certification?.[key]; return Array.isArray(entry) ? entry.join("\n") : String(entry ?? ""); };
  const checked = (key: string) => Boolean(certification?.[key]);
  const files = [...new Set([...(certification && value("storage_path") ? [value("storage_path")] : []), ...existingFiles])];
  const error = (name: string) => result?.ok ? undefined : result?.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      const name = Object.keys(result.fieldErrors ?? {})[0];
      const field = name && formRef.current?.elements.namedItem(name);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    toast.success(result.message ?? "Certificação salva.");
    if (result.data.path.startsWith("/admin/content/certifications/")) {
      startTransition(() => router.push(result.data.path));
    }
  }, [result, router]);

  return (
    <form ref={formRef} data-testid="certification-form" action={formAction} className="mt-6 grid max-w-3xl gap-4">
      <ActionFeedback result={result} />
      <input type="hidden" name="id" value={value("id")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title_pt" label="Título (PT)" value={value("title_pt")} required error={error("title_pt")} />
        <Field name="title_en" label="Título (EN)" value={value("title_en")} required error={error("title_en")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="issuer" label="Emissor" value={value("issuer")} required error={error("issuer")} />
        <SelectField name="category" label="Categoria" value={value("category") || "general"} options={categories} error={error("category")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="completed_at" label="Data de conclusão" value={value("completed_at")} type="date" required error={error("completed_at")} />
        <Field name="workload_hours" label="Carga horária (h)" value={value("workload_hours")} type="number" error={error("workload_hours")} />
        <Field name="display_order" label="Ordem" value={value("display_order") || "0"} type="number" required error={error("display_order")} />
      </div>
      <label className="grid gap-1 text-sm font-semibold">Arquivo PDF (no bucket)
        <select name="storage_path" defaultValue={value("storage_path") || ""} aria-invalid={Boolean(error("storage_path"))} aria-describedby={error("storage_path") ? "storage_path-error" : undefined} className="rounded-lg border border-[var(--line)] bg-transparent p-3">
          <option value="">Selecionar arquivo existente...</option>
          {files.map(file => <option key={file} value={file}>{file}</option>)}
        </select>
        {error("storage_path") && <span id="storage_path-error" className="text-sm font-normal text-red-600">{error("storage_path")}</span>}
      </label>
      <label className="grid gap-1 text-sm font-semibold">Ou enviar novo PDF
        <input name="pdf" type="file" accept="application/pdf" aria-invalid={Boolean(error("pdf"))} aria-describedby={error("pdf") ? "pdf-error" : undefined} className="rounded-lg border border-[var(--line)] bg-transparent p-3 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-soft)] file:px-3 file:py-1 file:font-semibold file:text-[var(--brand)]" />
        {error("pdf") && <span id="pdf-error" className="text-sm font-normal text-red-600">{error("pdf")}</span>}
      </label>
      <Field name="credential_url" label="URL da credencial (HTTPS, opcional)" value={value("credential_url")} type="url" error={error("credential_url")} />
      <label className="grid gap-1 text-sm font-semibold">Habilidades (uma por linha)<textarea name="skills" defaultValue={value("skills")} maxLength={4000} className="min-h-24 rounded-lg border border-[var(--line)] bg-transparent p-3" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <CheckboxField name="featured" label="Em destaque" checked={checked("featured")} error={error("featured")} />
        <CheckboxField name="recruiter_visible" label="Visível para recrutadores" checked={checked("recruiter_visible")} error={error("recruiter_visible")} />
      </div>
      <SubmitButton className="w-fit" pendingChildren="Salvando...">{certification ? "Salvar certificação" : "Criar rascunho"}</SubmitButton>
    </form>
  );
}

function Field({ name, label, value, type = "text", required = false, error }: { name: string; label: string; value: string; type?: string; required?: boolean; error?: string }) {
  return <label className="grid gap-1 text-sm font-semibold">{label}<input name={name} type={type} defaultValue={value} required={required} min={type === "number" ? 0 : undefined} step={type === "number" ? 0.5 : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="rounded-lg border border-[var(--line)] bg-transparent p-3" />{error && <span id={`${name}-error`} className="text-sm font-normal text-red-600">{error}</span>}</label>;
}

function SelectField({ name, label, value, options, error }: { name: string; label: string; value: string; options: string[]; error?: string }) {
  return <label className="grid gap-1 text-sm font-semibold">{label}<select name={name} defaultValue={value} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="rounded-lg border border-[var(--line)] bg-transparent p-3">{options.map(option => <option key={option} value={option}>{option}</option>)}</select>{error && <span id={`${name}-error`} className="text-sm font-normal text-red-600">{error}</span>}</label>;
}

function CheckboxField({ name, label, checked, error }: { name: string; label: string; checked: boolean; error?: string }) {
  return <label className="flex items-center gap-2 text-sm font-semibold"><input name={name} type="checkbox" defaultChecked={checked} aria-invalid={Boolean(error)} className="size-4 accent-[var(--brand)]" />{label}</label>;
}
