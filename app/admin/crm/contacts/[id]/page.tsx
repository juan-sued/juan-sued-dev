import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";
import { ContactNoteForm, ContactUpdateForm, ConvertContactButton } from "@/components/admin/contact-interactions";
import { ContactSensitiveActions } from "@/components/admin/crm-sensitive-actions";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: contact }, { data: notes }] = await Promise.all([
    supabase.from("contact_submissions").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("contact_notes")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!contact) notFound();
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/crm/contacts" className="text-sm font-semibold">
        ← Contatos
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{contact.name}</h1>
      <p className="mt-1 text-[var(--muted)]">
        {contact.email} · {contact.company || "Sem empresa"}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-5">
          <article className="rounded-lg border border-[var(--line)] p-5">
            <h2 className="font-bold">Mensagem</h2>
            <p className="mt-3 whitespace-pre-wrap">{contact.message}</p>
            <dl className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
              <div>Assunto: {contact.subject || "—"}</div>
              <div>Origem: {contact.source_path || "—"}</div>
              <div>Referrer: {contact.referrer || "—"}</div>
              <div>
                UTMs:{" "}
                {[contact.utm_source, contact.utm_medium, contact.utm_campaign]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </div>
              <div>
                Criado: {new Date(contact.created_at).toLocaleString("pt-BR")}
              </div>
            </dl>
          </article>
          <article className="rounded-lg border border-[var(--line)] p-5">
            <h2 className="font-bold">Notas internas</h2>
            {notes?.map((x) => (
              <p
                key={x.id}
                className="mt-3 border-t border-[var(--line)] pt-3 whitespace-pre-wrap"
              >
                {x.content}
              </p>
            )) || (
              <p className="mt-3 text-sm text-[var(--muted)]">Nenhuma nota.</p>
            )}
            <ContactNoteForm id={id} />
          </article>
        </section>
        <aside className="space-y-4 rounded-lg border border-[var(--line)] p-5">
          <ContactUpdateForm id={id} status={contact.status} priority={contact.priority} nextActionAt={contact.next_action_at} />
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent(contact.subject || "Contato")}`}
            className="block text-sm font-semibold"
          >
            Responder por e-mail
          </a>
           <ConvertContactButton id={id} />
           <ContactSensitiveActions id={id} archivedAt={contact.archived_at} status={contact.status} />
         </aside>
      </div>
    </AdminShell>
  );
}
