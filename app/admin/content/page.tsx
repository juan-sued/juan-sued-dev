import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { contentTypes } from "@/app/admin/content/types";
import { requireAdmin } from "@/lib/auth/admin";

const labels = { experiences: "Experiências", skills: "Competências", education: "Formação" };
export default async function ContentPage() { const admin = await requireAdmin(); return <AdminShell email={admin.email}><p className="text-sm text-[var(--muted)]">Administração / Conteúdo</p><h1 className="mt-2 text-3xl font-bold">Conteúdo</h1><div className="mt-6 grid gap-4 md:grid-cols-3">{contentTypes.map(type => <Link key={type} href={`/admin/content/${type}`} className="rounded-xl border border-[var(--line)] p-5 hover:bg-[var(--surface)]"><h2 className="font-semibold">{labels[type]}</h2><p className="mt-2 text-sm text-[var(--muted)]">Listar, criar e editar.</p></Link>)}<Link href="/admin/content/certifications" className="rounded-xl border border-[var(--line)] p-5 hover:bg-[var(--surface)]"><h2 className="font-semibold">Certificações</h2><p className="mt-2 text-sm text-[var(--muted)]">Listar, criar e editar.</p></Link></div></AdminShell>; }
