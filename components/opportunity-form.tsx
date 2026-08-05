"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveOpportunity } from "@/app/admin/crm/actions";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import { type ActionResult } from "@/lib/actions/action-result";

const statuses = ["prospect", "applied", "recruiter_contact", "screening", "technical_interview", "final_interview", "offer", "hired", "rejected", "withdrawn"];
type Opportunity = Record<string, string | number | null | undefined>;
type Result = ActionResult<{ id: string; path: string }> | null;

export function OpportunityForm({ opportunity }: { opportunity?: Opportunity }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [result, formAction] = useActionState<Result, FormData>(
    async (_previous, formData) => saveOpportunity(formData),
    null,
  );
  const val = (key: string) => String(opportunity?.[key] || "");

  useEffect(() => {
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      const name = Object.keys(result.fieldErrors ?? {})[0];
      const field = name && formRef.current?.elements.namedItem(name);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    toast.success(result.message ?? "Oportunidade salva.");
    if (result.data.path.startsWith("/admin/crm/opportunities/")) {
      startTransition(() => router.push(result.data.path));
    }
  }, [result, router]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 grid max-w-3xl gap-4">
      <ActionFeedback result={result} />
      <input type="hidden" name="id" value={val("id")} />
      <Field name="title" label="Título" value={val("title")} required error={result?.ok ? undefined : result?.fieldErrors?.title?.[0]} />
      <Field name="company_name" label="Empresa" value={val("company_name")} error={result?.ok ? undefined : result?.fieldErrors?.company_name?.[0]} />
      <Field name="contact_id" label="ID do contato (opcional)" value={val("contact_id")} error={result?.ok ? undefined : result?.fieldErrors?.contact_id?.[0]} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="employment_type" label="Tipo de contratação" value={val("employment_type")} error={result?.ok ? undefined : result?.fieldErrors?.employment_type?.[0]} />
        <Field name="work_model" label="Modelo de trabalho" value={val("work_model")} error={result?.ok ? undefined : result?.fieldErrors?.work_model?.[0]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="salary_min" label="Salário mínimo" value={val("salary_min")} type="number" error={result?.ok ? undefined : result?.fieldErrors?.salary_min?.[0]} />
        <Field name="salary_max" label="Salário máximo" value={val("salary_max")} type="number" error={result?.ok ? undefined : result?.fieldErrors?.salary_max?.[0]} />
        <Field name="currency" label="Moeda" value={val("currency") || "BRL"} required error={result?.ok ? undefined : result?.fieldErrors?.currency?.[0]} />
      </div>
      <SelectField name="status" label="Status" value={val("status") || "prospect"} options={statuses} error={result?.ok ? undefined : result?.fieldErrors?.status?.[0]} />
      <Field name="source" label="Origem" value={val("source")} error={result?.ok ? undefined : result?.fieldErrors?.source?.[0]} />
      <Field name="job_url" label="URL da vaga" value={val("job_url")} type="url" error={result?.ok ? undefined : result?.fieldErrors?.job_url?.[0]} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="next_action_at" label="Próxima ação" value={val("next_action_at").slice(0, 16)} type="datetime-local" error={result?.ok ? undefined : result?.fieldErrors?.next_action_at?.[0]} />
        <Field name="interview_at" label="Entrevista" value={val("interview_at").slice(0, 16)} type="datetime-local" error={result?.ok ? undefined : result?.fieldErrors?.interview_at?.[0]} />
      </div>
      <Field name="closed_at" label="Encerramento" value={val("closed_at").slice(0, 16)} type="datetime-local" error={result?.ok ? undefined : result?.fieldErrors?.closed_at?.[0]} />
      <label className="grid gap-1 text-sm font-semibold">Notas<textarea name="notes" defaultValue={val("notes")} maxLength={5000} className="min-h-32 rounded-lg border border-[var(--line)] bg-transparent p-3" /></label>
      <SubmitButton className="w-fit" pendingChildren="Salvando oportunidade...">{opportunity ? "Salvar oportunidade" : "Criar oportunidade"}</SubmitButton>
    </form>
  );
}

function Field({ name, label, value, type = "text", required = false, error }: { name: string; label: string; value: string; type?: string; required?: boolean; error?: string }) {
  return <label className="grid gap-1 text-sm font-semibold">{label}<input name={name} type={type} defaultValue={value} required={required} min={type === "number" ? 0 : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="rounded-lg border border-[var(--line)] bg-transparent p-3" />{error && <span id={`${name}-error`} className="text-sm font-normal text-red-600">{error}</span>}</label>;
}

function SelectField({ name, label, value, options, error }: { name: string; label: string; value: string; options: string[]; error?: string }) {
  return <label className="grid gap-1 text-sm font-semibold">{label}<select name={name} defaultValue={value} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="rounded-lg border border-[var(--line)] bg-transparent p-3">{options.map(option => <option key={option}>{option}</option>)}</select>{error && <span id={`${name}-error`} className="text-sm font-normal text-red-600">{error}</span>}</label>;
}
