"use client";

import { archiveCertification, publishCertification, restoreCertification, unpublishCertification } from "@/app/admin/content/certifications/actions";
import { SensitiveActionConfirmation } from "@/components/admin/sensitive-action-confirmation";

export function CertificationSensitiveActions({ id, publicationStatus }: { id: string; publicationStatus: string }) {
  return (
    <section className="mt-6 border-t border-[var(--line)] pt-4">
      <h2 className="text-sm font-bold">Publicação</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {publicationStatus === "archived" ? (
          <SensitiveActionConfirmation id={id} label="Restaurar" title="Restaurar certificação?" description="Certificação voltará ao rascunho." action={restoreCertification} />
        ) : publicationStatus === "published" ? (
          <SensitiveActionConfirmation id={id} label="Despublicar" title="Despublicar certificação?" description="Certificação voltará ao rascunho." action={unpublishCertification} />
        ) : (
          <SensitiveActionConfirmation id={id} label="Publicar" title="Publicar certificação?" description="Certificação ficará visível no portfólio." action={publishCertification} />
        )}
        {publicationStatus !== "archived" && <SensitiveActionConfirmation id={id} label="Arquivar" title="Arquivar certificação?" description="Certificação será removida da lista ativa." action={archiveCertification} />}
      </div>
    </section>
  );
}

const statusLabels: Record<string, string> = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" };

export function CertificationRowActions({ id, publicationStatus }: { id: string; publicationStatus: string }) {
  return (
    <span className="flex flex-wrap gap-2">
      {publicationStatus === "draft" && <SensitiveActionConfirmation id={id} label="Publicar" title="Publicar certificação?" description="Certificação ficará visível no portfólio." action={publishCertification} />}
      {publicationStatus === "published" && <SensitiveActionConfirmation id={id} label="Despublicar" title="Despublicar certificação?" description="Certificação voltará ao rascunho." action={unpublishCertification} />}
      {publicationStatus === "archived" && <SensitiveActionConfirmation id={id} label="Restaurar" title="Restaurar certificação?" description="Certificação voltará ao rascunho." action={restoreCertification} />}
      {publicationStatus !== "archived" && <SensitiveActionConfirmation id={id} label="Arquivar" title="Arquivar certificação?" description="Certificação será removida da lista ativa." action={archiveCertification} />}
      <span className="sr-only">Status: {statusLabels[publicationStatus] ?? publicationStatus}</span>
    </span>
  );
}
