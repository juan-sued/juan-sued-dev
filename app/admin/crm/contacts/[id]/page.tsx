import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";
import { convertContact, updateContact } from "../../actions";

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
            <form action={async formData => { await updateContact(formData); }} className="mt-4 grid gap-2">
              <input type="hidden" name="id" value={id} />
              <textarea
                name="note"
                required
                minLength={1}
                maxLength={5000}
                className="min-h-24 rounded-lg border border-[var(--line)] bg-transparent p-3"
                placeholder="Adicionar nota interna"
              />
              <button className="w-fit rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">
                Salvar nota
              </button>
            </form>
          </article>
        </section>
        <aside className="space-y-4 rounded-lg border border-[var(--line)] p-5">
          <form action={async formData => { await updateContact(formData); }} className="grid gap-3">
            <input type="hidden" name="id" value={id} />
            <label>
              Status
              <select
                name="status"
                defaultValue={contact.status}
                className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-transparent p-2"
              >
                {[
                  "new",
                  "reviewing",
                  "contacted",
                  "opportunity",
                  "interview",
                  "proposal",
                  "hired",
                  "closed",
                  "spam",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Prioridade
              <select
                name="priority"
                defaultValue={contact.priority}
                className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-transparent p-2"
              >
                {["low", "normal", "high", "urgent"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Próxima ação
              <input
                type="datetime-local"
                name="nextActionAt"
                defaultValue={contact.next_action_at?.slice(0, 16)}
                className="mt-1 block w-full rounded-lg border border-[var(--line)] bg-transparent p-2"
              />
            </label>
            <button className="rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">
              Salvar
            </button>
          </form>
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent(contact.subject || "Contato")}`}
            className="block text-sm font-semibold"
          >
            Responder por e-mail
          </a>
          <form action={async formData => { await convertContact(formData); }}>
            <input type="hidden" name="id" value={id} />
            <button className="text-sm font-semibold">
              Converter em oportunidade
            </button>
          </form>
        </aside>
      </div>
    </AdminShell>
  );
}
