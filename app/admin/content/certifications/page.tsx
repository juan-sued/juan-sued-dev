import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { CertificationRowActions } from "@/components/admin/certification-actions";
import { requireAdmin } from "@/lib/auth/admin";
import { certificationCategorySchema, listAdminCertifications } from "@/lib/repositories/certifications";

const pageSize = 20;

function label(status: string) {
  return status.replaceAll("_", " ");
}

function queryString(params: Record<string, string | undefined>, next: Record<string, string | undefined>) {
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...next })) if (value) values.set(key, value);
  return values.toString();
}

const statusLabel = (status: string) => ({ draft: "Rascunho", published: "Publicado", archived: "Arquivado" })[status] ?? label(status);

export default async function CertificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  let certifications;
  try {
    certifications = await listAdminCertifications({ q: params.q, publication_status: params.publication_status, category: params.category, featured: params.featured });
  } catch {
    certifications = null;
  }
  const url = (next: Record<string, string | undefined>) => `/admin/content/certifications?${queryString(params, next)}`;
  const rows = certifications?.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AdminShell email={admin.email}>
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm text-[var(--muted)]">Administração / Conteúdo / Certificações</p><h1 className="mt-2 text-3xl font-bold">Certificações</h1></div>
        <Link href="/admin/content/certifications/new" className="rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">Nova</Link>
      </div>
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <input name="q" defaultValue={params.q} placeholder="Buscar título ou emissor" className="rounded-lg border border-[var(--line)] bg-transparent p-2" />
        <select name="publication_status" defaultValue={params.publication_status} className="rounded-lg border border-[var(--line)] bg-transparent p-2"><option value="">Todos status</option><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select>
        <select name="category" defaultValue={params.category} className="rounded-lg border border-[var(--line)] bg-transparent p-2"><option value="">Todas categorias</option>{certificationCategorySchema.options.map(category => <option key={category} value={category}>{category}</option>)}</select>
        <select name="featured" defaultValue={params.featured} className="rounded-lg border border-[var(--line)] bg-transparent p-2"><option value="">Destaques</option><option value="true">Em destaque</option><option value="false">Sem destaque</option></select>
        <button className="rounded-lg bg-[var(--brand)] px-3 py-2 font-semibold text-white">Filtrar</button>
      </form>
      {certifications === null ? <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">Não foi possível carregar certificações. Tente atualizar página.</p> : <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--line)]"><table className="w-full min-w-[54rem] text-left text-sm"><thead className="border-b border-[var(--line)] text-[var(--muted)]"><tr><th className="p-4 font-medium">Certificação</th><th className="p-4 font-medium">Emissor</th><th className="p-4 font-medium">Categoria</th><th className="p-4 font-medium">Data</th><th className="p-4 font-medium">Carga</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Destaque</th><th className="p-4 font-medium">PDF</th><th className="p-4 font-medium">Ações</th></tr></thead><tbody>{rows?.map(item => <tr key={item.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)]"><td className="p-4 font-semibold"><Link href={`/admin/content/certifications/${item.id}`} className="hover:text-[var(--brand)]">{item.title_pt}</Link></td><td className="p-4">{item.issuer}</td><td className="p-4">{item.category}</td><td className="p-4">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(new Date(`${item.completed_at}T00:00:00Z`))}</td><td className="p-4">{item.workload_hours != null ? `${item.workload_hours}h` : "-"}</td><td className="p-4">{statusLabel(item.publication_status)}</td><td className="p-4">{item.featured ? "Sim" : "Não"}</td><td className="p-4"><a href={item.public_url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--brand)]">Abrir</a></td><td className="p-4"><CertificationRowActions id={item.id} publicationStatus={item.publication_status} /></td></tr>)}</tbody></table>{rows && !rows.length && <p className="p-4 text-sm text-[var(--muted)]">Nenhuma certificação encontrada.</p>}</div>}
      {certifications && (certifications.length ?? 0) > pageSize && <nav aria-label="Paginação" className="mt-6 flex items-center justify-between"><span className="text-sm text-[var(--muted)]">{certifications.length} certificações</span><div className="flex gap-3">{page > 1 && <Link href={url({ page: String(page - 1) })} className="font-semibold">Anterior</Link>}{page * pageSize < (certifications.length ?? 0) && <Link href={url({ page: String(page + 1) })} className="font-semibold">Próxima</Link>}</div></nav>}
    </AdminShell>
  );
}
