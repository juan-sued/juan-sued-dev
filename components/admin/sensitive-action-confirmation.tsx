"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ActionFeedback } from "@/components/admin/action-feedback";
import { Button } from "@/components/ui/button";
import { type ActionResult } from "@/lib/actions/action-result";

type Result = ActionResult<{ id: string }> | null;
type SensitiveAction = (formData: FormData) => Promise<ActionResult<{ id: string }>>;

export function SensitiveActionConfirmation({
  id,
  label,
  title,
  description,
  confirmLabel = label,
  action,
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  action: SensitiveAction;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const router = useRouter();
  const [result, formAction, pending] = useActionState<Result, FormData>(
    async (_previous, formData) => action(formData),
    null,
  );

  const close = () => {
    if (pending) return;
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || pending) return;
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending]);

  useEffect(() => {
    if (!result) return;
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }, [result, router]);

  return (
    <>
      <button ref={triggerRef} type="button" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--brand-soft)] focus-visible:outline-3 focus-visible:outline-[var(--brand)]" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            aria-describedby={`${dialogId}-description`}
            className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl"
          >
            <h2 id={`${dialogId}-title`} className="text-lg font-bold">{title}</h2>
            <p id={`${dialogId}-description`} className="mt-2 text-sm text-[var(--muted)]">{description}</p>
            <form action={formAction} className="mt-5 grid gap-3">
              <ActionFeedback result={result} />
              <input type="hidden" name="id" value={id} />
              <div className="flex flex-wrap justify-end gap-3">
                <button ref={cancelRef} type="button" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-sm font-semibold transition hover:bg-[var(--brand-soft)] focus-visible:outline-3 focus-visible:outline-[var(--brand)] disabled:pointer-events-none disabled:opacity-50" onClick={close}>Cancelar</button>
                <Button type="submit" disabled={pending}>{pending ? "Processando..." : confirmLabel}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
