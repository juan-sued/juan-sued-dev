"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

const links = [
  ["Visão geral", "/admin"],
  ["Contatos", "/admin/crm/contacts"],
  ["Oportunidades", "/admin/crm/opportunities"],
  ["Configurações", "/admin/settings"],
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const nav = <nav aria-label="Administração" className="grid gap-1">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[var(--surface)]">{label}</Link>)}<span className="px-3 py-2 text-sm text-[var(--muted)]">Conteúdos · Em breve</span><span className="px-3 py-2 text-sm text-[var(--muted)]">Projetos · Em breve</span><span className="px-3 py-2 text-sm text-[var(--muted)]">Estudos de caso · Em breve</span><span className="px-3 py-2 text-sm text-[var(--muted)]">Mídias · Em breve</span></nav>;
  return <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]"><aside className="hidden border-r border-[var(--line)] p-5 md:block"><Link href="/admin" className="text-lg font-bold">Admin</Link><div className="mt-8">{nav}</div></aside><div><header className="flex min-h-16 items-center justify-between border-b border-[var(--line)] px-4 md:px-8"><Button variant="outline" className="md:hidden" aria-label="Abrir navegação" onClick={() => setOpen(true)}><Menu size={18}/></Button><p className="hidden text-sm text-[var(--muted)] sm:block">{email}</p><div className="flex items-center gap-2"><Link href="/" className="text-sm font-semibold">Ver portfólio</Link><form action={logout}><Button variant="outline">Sair</Button></form></div></header>{open && <div className="fixed inset-0 z-50 bg-black/40 md:hidden"><aside className="h-full w-72 bg-[var(--bg)] p-5 shadow-xl"><Button variant="outline" aria-label="Fechar navegação" onClick={() => setOpen(false)}><X size={18}/></Button><div className="mt-6">{nav}</div></aside></div>}<main className="p-4 md:p-8">{children}</main></div></div>;
}
