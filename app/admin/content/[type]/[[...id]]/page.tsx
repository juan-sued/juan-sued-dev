import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ContentForm } from "@/components/admin/content-form";
import { parseContentType } from "@/app/admin/content/types";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const labels = { experiences: "Experiências", skills: "Competências", education: "Formação" };
export default async function ContentEntityPage({ params }: { params: Promise<{ type: string; id?: string[] }> }) {
  const { type: rawType, id: parts = [] } = await params;
  const type = parseContentType(rawType);
  if (!type || parts.length > 1) notFound();
  const admin = await requireAdmin();
  const id = parts[0];
  if (id === "new") return <AdminShell email={admin.email}><Link href={`/admin/content/${type}`} className="text-sm font-semibold">Voltar</Link><h1 className="mt-4 text-3xl font-bold">Nova {labels[type]}</h1><ContentForm type={type}/></AdminShell>;
  const supabase = await createClient();
  if (id) { const { data, error } = await supabase.from(type).select("*").eq("id", id).maybeSingle(); if (error || !data) notFound(); return <AdminShell email={admin.email}><Link href={`/admin/content/${type}`} className="text-sm font-semibold">Voltar</Link><h1 className="mt-4 text-3xl font-bold">Editar {labels[type]}</h1><ContentForm type={type} record={data}/></AdminShell>; }
  const displayColumn = { experiences: "company", skills: "category_pt", education: "institution" }[type];
  const { data, error } = await supabase.from(type).select("*").order("sort_order");
  const rows = data as unknown as Array<Record<string, unknown>> | null;
  return <AdminShell email={admin.email}><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-[var(--muted)]">Administração / Conteúdo</p><h1 className="mt-2 text-3xl font-bold">{labels[type]}</h1></div><Link href={`/admin/content/${type}/new`} className="rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">Novo</Link></div>{error ? <p role="alert" className="mt-6 text-red-600">Não foi possível carregar conteúdo.</p> : <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--line)]"><table className="w-full text-left text-sm"><thead className="border-b border-[var(--line)] text-[var(--muted)]"><tr><th className="p-4 font-medium">Item</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Ordem</th></tr></thead><tbody>{rows?.map(item => <tr key={String(item.id)} className="border-b border-[var(--line)] last:border-0"><td className="p-4 font-semibold"><Link href={`/admin/content/${type}/${String(item.id)}`} className="hover:text-[var(--brand)]">{String(item[displayColumn])}</Link></td><td className="p-4">{String(item.status)}</td><td className="p-4">{String(item.sort_order)}</td></tr>)}</tbody></table></div>}{!error && !rows?.length && <p className="mt-6 text-sm text-[var(--muted)]">Nenhum item encontrado.</p>}</AdminShell>;
}
