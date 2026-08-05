import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const contactStatus = "new,reviewing";
const openOpportunityStatuses = "(hired,rejected,withdrawn)";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [newContacts, waiting, active, interviews, contactActions, opportunityActions, contacts, opportunities] = await Promise.all([
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }).in("status", contactStatus.split(",")),
    supabase.from("opportunities").select("*", { count: "exact", head: true }).not("status", "in", openOpportunityStatuses),
    supabase.from("opportunities").select("*", { count: "exact", head: true }).in("status", ["screening", "technical_interview", "final_interview"]),
    supabase.from("contact_submissions").select("id,name,next_action_at").gte("next_action_at", now).order("next_action_at").limit(5),
    supabase.from("opportunities").select("id,title,next_action_at").gte("next_action_at", now).order("next_action_at").limit(5),
    supabase.from("contact_submissions").select("id,name,email,status,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("opportunities").select("id,title,status,company_name,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const errors = [newContacts, waiting, active, interviews, contactActions, opportunityActions, contacts, opportunities].some((result) => result.error);
  const cards: Array<[string, number | null, string]> = [
    ["Novos contatos", newContacts.count, "/admin/crm/contacts?status=new"],
    ["Aguardando resposta", waiting.count, "/admin/crm/contacts?status=new"],
    ["Oportunidades ativas", active.count, "/admin/crm/opportunities"],
    ["Entrevistas", interviews.count, "/admin/crm/opportunities?status=screening"],
  ];
  const upcoming = [
    ...(contactActions.data ?? []).map((item) => ({ ...item, href: `/admin/crm/contacts/${item.id}`, kind: "Contato" })),
    ...(opportunityActions.data ?? []).map((item) => ({ ...item, name: item.title, href: `/admin/crm/opportunities/${item.id}`, kind: "Oportunidade" })),
  ].sort((a, b) => new Date(a.next_action_at).getTime() - new Date(b.next_action_at).getTime()).slice(0, 5);

  return <AdminShell email={admin.email}>
    <p className="text-sm text-[var(--muted)]">Administração / Visão geral</p>
    <h1 className="mt-2 text-3xl font-bold">Visão geral</h1>
    {errors && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">Parte dos dados não carregou. Tente atualizar página.</p>}
    <section aria-label="Resumo" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([title, count, href]) => <Link key={title} href={href} className="rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"><Card className="h-full transition hover:border-[var(--brand)]"><CardHeader><p className="text-sm text-[var(--muted)]">{title}</p></CardHeader><CardContent><strong className="text-3xl">{count ?? "-"}</strong><span className="mt-2 block text-sm font-semibold">Ver registros</span></CardContent></Card></Link>)}
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <List title="Contatos recentes" href="/admin/crm/contacts" empty="Nenhum contato ainda." items={contacts.data?.map((item) => <Link href={`/admin/crm/contacts/${item.id}`} key={item.id} className="block rounded-lg py-3 first:pt-0 hover:text-[var(--brand)]"><strong>{item.name}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{item.email} · {label(item.status)}</span></Link>)} />
      <List title="Oportunidades recentes" href="/admin/crm/opportunities" empty="Nenhuma oportunidade ainda." items={opportunities.data?.map((item) => <Link href={`/admin/crm/opportunities/${item.id}`} key={item.id} className="block rounded-lg py-3 first:pt-0 hover:text-[var(--brand)]"><strong>{item.title}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{item.company_name || "Sem empresa"} · {label(item.status)}</span></Link>)} />
      <List title="Próximas ações" href="/admin/crm/contacts" empty="Nenhuma ação agendada." items={upcoming.map((item) => <Link href={item.href} key={`${item.kind}-${item.id}`} className="block rounded-lg py-3 first:pt-0 hover:text-[var(--brand)]"><strong>{item.name}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{item.kind} · {formatDate(item.next_action_at)}</span></Link>)} />
      <Card><CardHeader><h2 className="font-bold">Acesso rápido</h2></CardHeader><CardContent className="grid gap-3"><Link href="/admin/crm/contacts?status=new" className="font-semibold hover:text-[var(--brand)]">Revisar novos contatos</Link><Link href="/admin/crm/opportunities/new" className="font-semibold hover:text-[var(--brand)]">Criar oportunidade</Link><Link href="/admin/crm/opportunities?view=board" className="font-semibold hover:text-[var(--brand)]">Abrir quadro de oportunidades</Link></CardContent></Card>
    </section>
  </AdminShell>;
}

function List({ title, href, empty, items }: { title: string; href: string; empty: string; items?: React.ReactNode[] }) {
  return <Card><CardHeader><div className="flex items-center justify-between gap-4"><h2 className="font-bold">{title}</h2><Link href={href} className="text-sm font-semibold">Ver todos</Link></div></CardHeader><CardContent>{items?.length ? <div className="divide-y divide-[var(--line)]">{items}</div> : <p className="text-sm text-[var(--muted)]">{empty}</p>}</CardContent></Card>;
}
