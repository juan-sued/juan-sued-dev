"use client";

import { useActionState } from "react";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import { type ActionResult } from "@/lib/actions/action-result";
import { uploadResume } from "@/app/admin/content/resumes/actions";

export function ResumeUploadForm({ kind }: { kind: "ats" | "visual" }) {
  const [result, formAction] = useActionState<ActionResult<{ kind: string }> | null, FormData>((_previous, formData) => uploadResume(formData), null);
  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="file" name="pdf" accept="application/pdf" required className="rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
      <SubmitButton pendingChildren="Enviando...">Enviar novo PDF</SubmitButton>
      <ActionFeedback result={result} />
    </form>
  );
}
