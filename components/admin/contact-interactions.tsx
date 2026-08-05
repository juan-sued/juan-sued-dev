"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addContactNote, convertContact, updateContact } from "@/app/admin/crm/actions";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import { type ActionResult } from "@/lib/actions/action-result";

type UpdateResult = ActionResult<{ id: string }> | null;
type ConvertResult = ActionResult<{ id: string; path: string }> | null;

export function ContactNoteForm({ id }: { id: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [result, formAction] = useActionState<UpdateResult, FormData>(async (_previous, formData) => addContactNote(formData), null);

  useEffect(() => {
    if (!result) return;
    if (!result.ok) { toast.error(result.message); return; }
    formRef.current?.reset();
    toast.success("Nota salva.");
    router.refresh();
  }, [result, router]);

  return <form ref={formRef} action={formAction} className="mt-4 grid gap-2"><ActionFeedback result={result} /><input type="hidden" name="id" value={id} /><textarea name="note" required minLength={1} maxLength={5000} className="min-h-24 rounded-lg border border-[var(--line)] bg-transparent p-3" placeholder="Adicionar nota interna" /><SubmitButton className="w-fit" pendingChildren="Salvando nota...">Salvar nota</SubmitButton></form>;
}

export function ContactUpdateForm({
  id,
  status,
  priority,
  nextActionAt,
}: {
  id: string;
  status: string;
  priority: string;
  nextActionAt?: string | null;
}) {
  const router = useRouter();
  const [result, formAction] = useActionState<UpdateResult, FormData>(async (_previous, formData) => updateContact(formData), null);

  useEffect(() => {
    if (!result) return;
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Contato atualizado.");
    router.refresh();
  }, [result, router]);

  return <form action={formAction} className="grid gap-3"><ActionFeedback result={result} /><input type="hidden" name="id" value={id} /><label>Status<select name="status" defaultValue={status} className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-transparent p-2">{["new", "reviewing", "contacted", "opportunity", "interview", "proposal", "hired", "closed", "spam"].map(option => <option key={option}>{option}</option>)}</select></label><label>Prioridade<select name="priority" defaultValue={priority} className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-transparent p-2">{["low", "normal", "high", "urgent"].map(option => <option key={option}>{option}</option>)}</select></label><label>Próxima ação<input type="datetime-local" name="nextActionAt" defaultValue={nextActionAt?.slice(0, 16)} className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-transparent p-2" /></label><SubmitButton pendingChildren="Salvando contato...">Salvar</SubmitButton></form>;
}

export function ConvertContactButton({ id }: { id: string }) {
  const router = useRouter();
  const [result, formAction] = useActionState<ConvertResult, FormData>(async (_previous, formData) => convertContact(formData), null);

  useEffect(() => {
    if (!result) return;
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(result.message ?? "Contato convertido em oportunidade.");
    if (result.data.path.startsWith("/admin/crm/opportunities/")) startTransition(() => router.push(result.data.path));
  }, [result, router]);

  return <form action={formAction} className="mt-3"><ActionFeedback result={result} className="mb-2" /><input type="hidden" name="id" value={id} /><SubmitButton variant="ghost" className="h-auto min-h-0 px-0 py-0 text-sm" pendingChildren="Convertendo...">Converter em oportunidade</SubmitButton></form>;
}
