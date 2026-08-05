"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command, Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

export const adminNavItems = [
  { label: "Visão geral", href: "/admin" },
  { label: "Contatos", href: "/admin/crm/contacts" },
  { label: "Oportunidades", href: "/admin/crm/opportunities" },
  { label: "Configurações", href: "/admin/settings" },
] as const;

type CommandItem = { label: string; href: string; external?: boolean } | { label: string; action: "theme" | "logout" };

const commandItems: CommandItem[] = [...adminNavItems, { label: "Nova oportunidade", href: "/admin/crm/opportunities/new" }, { label: "Abrir portfólio", href: "/", external: true }, { label: "Alternar tema", action: "theme" }, { label: "Sair", action: "logout" }];

export function isAdminNavActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function pageCrumbs(pathname: string) {
  if (pathname === "/admin") return ["Administração", "Visão geral"];
  if (pathname.startsWith("/admin/crm/contacts")) return ["Administração", "Contatos", ...(pathname === "/admin/crm/contacts" ? [] : ["Detalhes"])];
  if (pathname.startsWith("/admin/crm/opportunities")) return ["Administração", "Oportunidades", ...(pathname === "/admin/crm/opportunities" ? [] : [pathname.endsWith("/new") ? "Nova" : "Detalhes"])];
  if (pathname === "/admin/settings") return ["Administração", "Configurações"];
  return ["Administração"];
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const commandTrigger = useRef<HTMLButtonElement>(null);
  const modalOpen = sheetOpen || commandOpen;
  const crumbs = pageCrumbs(pathname);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (modalOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modalOpen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeSheet = () => { setSheetOpen(false); requestAnimationFrame(() => menuTrigger.current?.focus()); };
  const closeCommand = () => { setCommandOpen(false); requestAnimationFrame(() => commandTrigger.current?.focus()); };
  const changeTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.cookie = `juan-theme=${next};path=/;max-age=31536000;samesite=lax`;
    localStorage.setItem("juan-theme", next);
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  const navigate = (href: string) => { closeCommand(); router.push(href); };
  const nav = <Navigation pathname={pathname} onNavigate={closeSheet}/>;

  return <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] md:grid md:grid-cols-[16rem_1fr]">
    <aside className="hidden border-r border-[var(--line)] bg-[var(--surface)] p-5 md:block"><Brand/>{<div className="mt-8">{nav}</div>}</aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--line)] bg-[color:var(--bg)]/95 px-4 backdrop-blur md:px-8">
        <Button ref={menuTrigger} variant="outline" className="md:hidden" aria-label="Abrir navegação" aria-expanded={sheetOpen} aria-controls="admin-navigation" onClick={() => setSheetOpen(true)}><Menu size={18}/></Button>
        <nav aria-label="Breadcrumb" className="min-w-0"><ol className="flex items-center gap-2 overflow-hidden text-sm text-[var(--muted)]">{crumbs.map((crumb, index) => <li key={`${crumb}-${index}`} className="flex shrink-0 items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}<span aria-current={index === crumbs.length - 1 ? "page" : undefined}>{crumb}</span></li>)}</ol></nav>
        <div className="flex items-center gap-1">
          <Button ref={commandTrigger} variant="outline" aria-label="Abrir comandos" onClick={() => setCommandOpen(true)}><Command size={17}/><span className="ml-2 hidden sm:inline">Comandos</span><kbd className="ml-2 hidden rounded border border-[var(--line)] px-1 text-xs text-[var(--muted)] lg:inline">⌘K</kbd></Button>
          <Button variant="outline" aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"} onClick={changeTheme}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</Button>
          <form action={logout} className="hidden sm:block"><Button variant="outline">Sair</Button></form>
        </div>
      </header>
      <div className="border-b border-[var(--line)] px-4 py-2 text-xs text-[var(--muted)] md:px-8">{email} <Link href="/" className="ml-3 font-semibold text-[var(--ink)]">Ver portfólio</Link></div>
      <main id="admin-content" className="p-4 md:p-8">{children}</main>
    </div>
    {sheetOpen && <Dialog id="admin-navigation" title="Navegação" close={closeSheet}><Brand/><div className="mt-6">{nav}</div><form action={logout} className="mt-6"><Button variant="outline" className="w-full">Sair</Button></form></Dialog>}
    {commandOpen && <CommandMenu close={closeCommand} navigate={navigate} changeTheme={changeTheme}/>}
  </div>;
}

function Brand() { return <Link href="/admin" className="text-lg font-bold tracking-tight">JUAN<span className="text-[var(--brand)]">.SUED</span><span className="ml-2 text-xs font-semibold text-[var(--muted)]">ADMIN</span></Link>; }

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return <nav aria-label="Administração" className="grid gap-1">{adminNavItems.map(item => <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={isAdminNavActive(pathname, item.href) ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-[var(--brand-soft)] ${isAdminNavActive(pathname, item.href) ? "bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`}>{item.label}</Link>)}</nav>;
}

function Dialog({ id, title, close, children }: { id: string; title: string; close: () => void; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab") return;
      const nodes = root.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);
  return <div className="fixed inset-0 z-50 bg-black/40 p-4" onMouseDown={close}><section ref={root} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="h-full w-full max-w-sm overflow-auto bg-[var(--surface)] p-5 shadow-2xl" onMouseDown={event => event.stopPropagation()}><div className="flex items-center justify-between"><h2 id={`${id}-title`} className="font-bold">{title}</h2><Button ref={closeButton} variant="outline" aria-label="Fechar" onClick={close}><X size={18}/></Button></div>{children}</section></div>;
}

function CommandMenu({ close, navigate, changeTheme }: { close: () => void; navigate: (href: string) => void; changeTheme: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const items = commandItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
  const run = (item: CommandItem) => {
    if ("href" in item) {
      if (item.external) { window.open(item.href, "_blank", "noopener,noreferrer"); close(); }
      else navigate(item.href);
      return;
    }
    if (item.action === "theme") { changeTheme(); close(); }
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!items.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setSelected(index => (index + 1) % items.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); setSelected(index => (index - 1 + items.length) % items.length); }
    if (event.key === "Enter") { event.preventDefault(); run(items[selected]); }
  };
  return <Dialog id="admin-command-menu" title="Comandos" close={close}><div className="mt-5"><label htmlFor="admin-command-search" className="sr-only">Buscar comandos</label><input autoFocus id="admin-command-search" value={query} onChange={event => { setQuery(event.target.value); setSelected(0); }} onKeyDown={onKeyDown} placeholder="Buscar páginas..." className="w-full rounded-lg border border-[var(--line)] bg-transparent p-3"/><div role="listbox" aria-label="Comandos" className="mt-3 grid gap-1">{items.map((item, index) => "action" in item && item.action === "logout" ? <form key={item.label} action={logout} onSubmit={close}><button role="option" aria-selected={selected === index} onMouseEnter={() => setSelected(index)} className={`w-full rounded-lg p-3 text-left font-semibold hover:bg-[var(--brand-soft)] ${selected === index ? "bg-[var(--brand-soft)]" : ""}`}>{item.label}</button></form> : <button key={item.label} role="option" aria-selected={selected === index} onMouseEnter={() => setSelected(index)} onClick={() => run(item)} className={`rounded-lg p-3 text-left font-semibold hover:bg-[var(--brand-soft)] ${selected === index ? "bg-[var(--brand-soft)]" : ""}`}>{item.label}{"href" in item && <span className="ml-2 text-sm font-normal text-[var(--muted)]">{item.href}</span>}</button>)}{!items.length && <p className="p-3 text-sm text-[var(--muted)]">Nenhum comando encontrado.</p>}</div></div></Dialog>;
}
