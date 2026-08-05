"use client";

import { archiveContact, closeOpportunity, markContactAsSpam, reopenOpportunity, restoreContact, unlinkOpportunityContact } from "@/app/admin/crm/actions";
import { SensitiveActionConfirmation } from "@/components/admin/sensitive-action-confirmation";

export function ContactSensitiveActions({ id, archivedAt, status }: { id: string; archivedAt?: string | null; status: string }) {
  return (
    <section className="border-t border-[var(--line)] pt-4">
      <h2 className="text-sm font-bold">Ações sensíveis</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <SensitiveActionConfirmation id={id} label={archivedAt ? "Restaurar contato" : "Arquivar contato"} title={archivedAt ? "Restaurar contato?" : "Arquivar contato?"} description={archivedAt ? "Contato voltará à lista ativa." : "Contato será removido da lista ativa."} action={archivedAt ? restoreContact : archiveContact} />
        {status !== "spam" && <SensitiveActionConfirmation id={id} label="Marcar como spam" title="Marcar contato como spam?" description="Status do contato será alterado para spam." action={markContactAsSpam} />}
      </div>
    </section>
  );
}

export function OpportunitySensitiveActions({ id, closedAt, contactId }: { id: string; closedAt?: string | null; contactId?: string | null }) {
  return (
    <section className="mt-6 border-t border-[var(--line)] pt-4">
      <h2 className="text-sm font-bold">Ações sensíveis</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <SensitiveActionConfirmation id={id} label={closedAt ? "Reabrir oportunidade" : "Fechar oportunidade"} title={closedAt ? "Reabrir oportunidade?" : "Fechar oportunidade?"} description={closedAt ? "Data de encerramento será removida." : "Oportunidade receberá data de encerramento."} action={closedAt ? reopenOpportunity : closeOpportunity} />
        {contactId && <SensitiveActionConfirmation id={id} label="Desvincular contato" title="Desvincular contato?" description="Vínculo entre oportunidade e contato será removido." action={unlinkOpportunityContact} />}
      </div>
    </section>
  );
}
