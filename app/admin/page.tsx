import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { logout } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
export default async function AdminPage() { const admin = await requireAdmin(); return <main className="shell py-10"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-[var(--muted)]">{admin.email}</p><h1 className="text-3xl font-semibold">Painel administrativo</h1></div><div className="flex gap-3"><Link href="/" className="rounded-lg border border-[var(--line)] px-4 py-3 text-sm font-semibold">Abrir portfólio</Link><form action={logout}><Button variant="outline">Sair</Button></form></div></header><Separator/><Card className="mt-8"><CardHeader><h2 className="text-xl font-semibold">CRM em preparação</h2></CardHeader><CardContent><p className="text-[var(--muted)]">Contatos, oportunidades e conteúdos serão implementados posteriormente.</p></CardContent></Card><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["Contatos", "Oportunidades", "Conteúdos", "Configurações"].map(item => <Button key={item} variant="outline" disabled>{item}</Button>)}</div></main>; }
