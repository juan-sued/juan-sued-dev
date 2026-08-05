import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";

const statuses = ["prospect", "applied", "recruiter_contact", "screening", "technical_interview", "final_interview", "offer", "hired", "rejected", "withdrawn"];
const pageSize = 20;

function label(status: string) {
  return status.replaceAll("_", " ");
}

function queryString(params: Record<string, string | undefined>, next: Record<string, string | undefined>) {
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...next })) if (value) values.set(key, value);
  return values.toString();
}

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const board = params.view === "board";
  const supabase = await createClient();
  let query = supabase.from("opportunities").select("id,title,company_name,status,next_action_at,created_at", { count: "exact" });
  if (params.q) {
    const term = params.q.replace(/[,%()]/g, "");
    query = query.or(`title.ilike.%${term}%,company_name.ilike.%${term}%`);
  }
  if (params.status) query = query.eq("status", params.status);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(board ? 0 : (page - 1) * pageSize, board ? 99 : page * pageSize - 1);
  const url = (next: Record<string, string | undefined>) => `/admin/crm/opportunities?${queryString(params, next)}`;
  const byStatus = statuses.map((status) => [status, data?.filter((item) => item.status === status) ?? []] as const).filter(([, items]) => items.length || !params.status);

  return <AdminShell email={admin.email}>
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-[var(--muted)]">Administração / Oportunidades</p><h1 className="mt-2 text-3xl font-bold">Oportunidades</h1></div><Link href="/admin/crm/opportunities/new" className="rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">Nova</Link></div>
    <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"><input name="q" defaultValue={params.q} placeholder="Buscar vaga ou empresa" className="rounded-lg border border-[var(--line)] bg-transparent p-2"/><select name="status" defaultValue={params.status} className="rounded-lg border border-[var(--line)] bg-transparent p-2"><option value="">Todas etapas</option>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select><input type="hidden" name="view" value={board ? "board" : ""}/><button className="rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">Filtrar</button><Link href={url({ view: board ? undefined : "board", page: undefined })} className="rounded-lg border border-[var(--line)] px-3 py-2 text-center font-semibold">{board ? "Tabela" : "Quadro"}</Link></form>
    {error ? <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">Não foi possível carregar oportunidades. Tente atualizar página.</p> : board ? <Board groups={byStatus} /> : <Table items={data ?? []} />}
    {!error && !data?.length && <p className="mt-6 text-sm text-[var(--muted)]">Nenhuma oportunidade encontrada.</p>}
    {!board && !error && (count ?? 0) > pageSize && <nav aria-label="Paginação" className="mt-6 flex items-center justify-between"><span className="text-sm text-[var(--muted)]">{count} oportunidades</span><div className="flex gap-3">{page > 1 && <Link href={url({ page: String(page - 1) })} className="font-semibold">Anterior</Link>}{page * pageSize < (count ?? 0) && <Link href={url({ page: String(page + 1) })} className="font-semibold">Próxima</Link>}</div></nav>}
  </AdminShell>;
}

type Opportunity = { id: string; title: string; company_name: string | null; status: string; next_action_at: string | null };

function Table({ items }: { items: Opportunity[] }) {
  return <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--line)]"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="border-b border-[var(--line)] text-[var(--muted)]"><tr><th className="p-4 font-medium">Oportunidade</th><th className="p-4 font-medium">Empresa</th><th className="p-4 font-medium">Etapa</th><th className="p-4 font-medium">Próxima ação</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)]"><td className="p-4 font-semibold"><Link href={`/admin/crm/opportunities/${item.id}`} className="hover:text-[var(--brand)]">{item.title}</Link></td><td className="p-4">{item.company_name || "Sem empresa"}</td><td className="p-4">{label(item.status)}</td><td className="p-4">{item.next_action_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(item.next_action_at)) : "-"}</td></tr>)}</tbody></table></div>;
}

function Board({ groups }: { groups: readonly (readonly [string, Opportunity[]])[] }) {
  return <div className="mt-6 flex gap-4 overflow-x-auto pb-4" aria-label="Quadro de oportunidades">{groups.map(([status, items]) => <section key={status} className="w-72 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><div className="flex items-center justify-between"><h2 className="font-semibold capitalize">{label(status)}</h2><span className="text-sm text-[var(--muted)]">{items.length}</span></div><div className="mt-4 grid gap-3">{items.map((item) => <Link href={`/admin/crm/opportunities/${item.id}`} key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"><strong className="block">{item.title}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{item.company_name || "Sem empresa"}</span>{item.next_action_at && <span className="mt-3 block text-xs text-[var(--muted)]">Ação: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(item.next_action_at))}</span>}</Link>)}{!items.length && <p className="text-sm text-[var(--muted)]">Vazio</p>}</div></section>)}</div>;
}
