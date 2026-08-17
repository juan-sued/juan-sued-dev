"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Command, Menu, Moon, Sun, X } from "lucide-react";
import type { Locale } from "@/content/data";
import { track } from "@/lib/analytics";

type Props = { children: React.ReactNode; locale: Locale; theme: "light" | "dark"; recruiter: boolean };
type Action = () => void;
const nav = [["/", "Início", "Home"], ["/experiencia", "Experiência", "Experience"], ["/projetos", "Projetos", "Projects"], ["/sobre", "Sobre", "About"], ["/curriculo", "Currículo", "Resume"], ["/contato", "Contato", "Contact"], ["/certificacoes", "Certificações", "Certifications"]] as const;
const setCookie = (name: string, value: string) => { document.cookie = `${name}=${value};path=/;max-age=31536000;samesite=lax`; };
const label = (locale: Locale, pt: string, en: string) => locale === "pt" ? pt : en;

export function ClientShell({ children, locale, theme, recruiter: initialRecruiter }: Props) {
  const pathname = usePathname();
  const [recruiter, setRecruiter] = useState(initialRecruiter);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const commandTrigger = useRef<HTMLButtonElement>(null);
  const modalOpen = mobileOpen || commandOpen;

  useEffect(() => {
    const background = [document.getElementById("site-header"), document.getElementById("site-content")];
    background.forEach(node => node?.toggleAttribute("inert", modalOpen));
    const previousOverflow = document.body.style.overflow;
    if (modalOpen) document.body.style.overflow = "hidden";
    return () => { background.forEach(node => node?.removeAttribute("inert")); document.body.style.overflow = previousOverflow; };
  }, [modalOpen]);
  useEffect(() => { const key = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, []);

  const changeLocale: Action = () => { const next = locale === "pt" ? "en" : "pt"; setCookie("juan-locale", next); localStorage.setItem("juan-locale", next); track("language_changed", { locale: next }); window.location.reload(); };
  const changeTheme: Action = () => { const next = theme === "light" ? "dark" : "light"; setCookie("juan-theme", next); localStorage.setItem("juan-theme", next); document.documentElement.dataset.theme = next; window.location.reload(); };
  const changeRecruiter: Action = () => { const next = !recruiter; setRecruiter(next); setCookie("juan-recruiter", String(next)); if (next) track("recruiter_mode_enabled"); };
  const closeMobile = () => { setMobileOpen(false); requestAnimationFrame(() => mobileTrigger.current?.focus()); };
  const closeCommand = () => { setCommandOpen(false); requestAnimationFrame(() => commandTrigger.current?.focus()); };

  if (pathname?.startsWith("/admin")) return <>{children}</>;
  return <div data-recruiter={recruiter ? "true" : "false"}>
    <Header locale={locale} theme={theme} recruiter={recruiter} mobileOpen={mobileOpen} mobileTrigger={mobileTrigger} commandTrigger={commandTrigger} onLocale={changeLocale} onTheme={changeTheme} onRecruiter={changeRecruiter} onMobile={() => setMobileOpen(true)} onCommand={() => setCommandOpen(true)}/>
    <div id="site-content">
      {recruiter && <div className="shell recruiter-summary mt-4 rounded-lg bg-[var(--brand-soft)] px-4 py-3 text-sm font-bold">{label(locale, "Modo Recrutador - Visão em 60 segundos", "Recruiter Mode - 60-second view")}</div>}
      {children}
    </div>
    {mobileOpen && <MobileNavigation locale={locale} close={closeMobile}/>} 
    {commandOpen && <CommandMenu locale={locale} recruiter={recruiter} close={closeCommand} onLocale={changeLocale} onTheme={changeTheme} onRecruiter={changeRecruiter}/>} 
  </div>;
}

function Header({ locale, theme, recruiter, mobileOpen, mobileTrigger, commandTrigger, onLocale, onTheme, onRecruiter, onMobile, onCommand }: { locale: Locale; theme: "light" | "dark"; recruiter: boolean; mobileOpen: boolean; mobileTrigger: React.RefObject<HTMLButtonElement | null>; commandTrigger: React.RefObject<HTMLButtonElement | null>; onLocale: Action; onTheme: Action; onRecruiter: Action; onMobile: Action; onCommand: Action }) {
  return <header id="site-header" className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--bg)]/90 backdrop-blur">
    <div className="shell flex h-16 items-center justify-between gap-3">
      <Link href="/" className="font-bold tracking-tight">JUAN<span className="text-[var(--brand)]">.SUED</span></Link>
      <nav className="hidden items-center gap-5 text-sm text-[var(--muted)] md:flex" aria-label={label(locale, "Principal", "Primary")}>{nav.slice(0, 5).map(([href, pt, en]) => <Link key={href} href={href}>{label(locale, pt, en)}</Link>)}</nav>
      <div className="flex items-center gap-1">
        <Control onClick={onLocale} aria-label={label(locale, "Idioma", "Language")}>{locale.toUpperCase()}</Control>
        <Control onClick={onTheme} aria-label={label(locale, "Tema", "Theme")}>{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</Control>
        <Control onClick={onRecruiter} className="hidden px-3 text-xs font-bold sm:inline-flex" aria-pressed={recruiter}>{recruiter ? label(locale, "Detalhes técnicos", "Technical details") : label(locale, "Modo Recrutador", "Recruiter mode")}</Control>
        <Control ref={commandTrigger} onClick={onCommand} className="hidden sm:inline-flex" aria-label={label(locale, "Menu de comandos", "Command menu")}><Command size={18}/></Control>
        <Control ref={mobileTrigger} onClick={onMobile} className="md:hidden" aria-label={label(locale, "Abrir menu", "Open menu")} aria-expanded={mobileOpen} aria-controls="mobile-navigation"><Menu size={20}/></Control>
      </div>
    </div>
  </header>;
}

const Control = ({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }) => <button {...props} className={`inline-flex size-11 items-center justify-center rounded-lg transition hover:bg-[var(--brand-soft)] ${className}`}/>;

function Modal({ children, title, close, id }: { children: React.ReactNode; title: string; close: Action; id: string }) {
  const root = useRef<HTMLDivElement>(null); const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeButton.current?.focus(); const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); if (event.key === "Tab") { const nodes = root.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'); if (!nodes?.length) return; const first = nodes[0], last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } }; document.addEventListener("keydown", key); return () => document.removeEventListener("keydown", key); }, [close]);
  return <div className="fixed inset-0 z-50 bg-black/40 p-4 pt-16" onMouseDown={close}><div ref={root} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="mx-auto max-h-[calc(100vh-5rem)] w-full max-w-xl overflow-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-2xl" onMouseDown={event => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[var(--line)] p-3"><h2 id={`${id}-title`} className="font-bold">{title}</h2><Control ref={closeButton} onClick={close} aria-label="Close"><X size={18}/></Control></div>{children}</div></div>;
}

function MobileNavigation({ locale, close }: { locale: Locale; close: Action }) { return <Modal id="mobile-navigation" title={label(locale, "Navegação", "Navigation")} close={close}><nav className="grid p-2" aria-label={label(locale, "Navegação móvel", "Mobile navigation")}>{nav.map(([href, pt, en]) => <Link key={href} href={href} onClick={close} className="rounded-lg p-4 text-lg font-semibold hover:bg-[var(--brand-soft)]">{label(locale, pt, en)}</Link>)}</nav></Modal>; }

function CommandMenu({ locale, recruiter, close, onLocale, onTheme, onRecruiter }: { locale: Locale; recruiter: boolean; close: Action; onLocale: Action; onTheme: Action; onRecruiter: Action }) { const actions = [[label(locale, "Início", "Home"), "/"], [label(locale, "Experiência", "Experience"), "/experiencia"], [label(locale, "Projetos", "Projects"), "/projetos"], ["BikerWay", "/projetos/bikerway"], [label(locale, "Estudos de caso", "Case studies"), "/projetos"], [label(locale, "Sobre", "About"), "/sobre"], [label(locale, "Certificações", "Certifications"), "/certificacoes"], [label(locale, "Currículo", "Resume"), "/curriculo"], [label(locale, "Contato", "Contact"), "/contato"]]; return <Modal id="command-menu" title={label(locale, "Menu de comandos", "Command menu")} close={close}><div className="grid p-2">{actions.map(([name, href]) => <Link key={`${name}-${href}`} href={href} onClick={close} className="rounded-lg p-3 hover:bg-[var(--brand-soft)]">{name}</Link>)}<a download href="/curriculos/juan-sued-cv-ats.pdf" onClick={() => track("resume_download_ats")} className="rounded-lg p-3 hover:bg-[var(--brand-soft)]">{label(locale, "Baixar currículo ATS", "Download ATS resume")}</a><a download href="/curriculos/juan-sued-cv-visual.pdf" onClick={() => track("resume_download_visual")} className="rounded-lg p-3 hover:bg-[var(--brand-soft)]">{label(locale, "Baixar currículo visual", "Download visual resume")}</a><a href="https://www.linkedin.com/in/juan-sued/" target="_blank" rel="noopener noreferrer" onClick={() => track("linkedin_click")} className="rounded-lg p-3 hover:bg-[var(--brand-soft)]">LinkedIn</a><a href="https://github.com/juan-sued" target="_blank" rel="noopener noreferrer" onClick={() => track("github_click")} className="rounded-lg p-3 hover:bg-[var(--brand-soft)]">GitHub</a><a href="mailto:juansued19@gmail.com" onClick={() => track("email_click")} className="rounded-lg p-3 hover:bg-[var(--brand-soft)]">{label(locale, "Enviar e-mail", "Send email")}</a><button onClick={onLocale} className="rounded-lg p-3 text-left hover:bg-[var(--brand-soft)]">{label(locale, "Alternar idioma", "Switch language")}</button><button onClick={onTheme} className="rounded-lg p-3 text-left hover:bg-[var(--brand-soft)]">{label(locale, "Alternar tema", "Switch theme")}</button><button onClick={onRecruiter} className="rounded-lg p-3 text-left hover:bg-[var(--brand-soft)]">{recruiter ? label(locale, "Desativar Modo Recrutador", "Disable recruiter mode") : label(locale, "Ativar Modo Recrutador", "Enable recruiter mode")}</button></div></Modal>; }
