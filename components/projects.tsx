import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import type { Locale } from "@/lib/locale";
import type { Project } from "@/lib/repositories/projects";

const t = (value: { pt: string; en: string }, locale: Locale) => value[locale];
const label = (locale: Locale, pt: string, en: string) => locale === "pt" ? pt : en;
const statusLabel = (status: Project["status"], locale: Locale) => status === "production" ? label(locale, "Em produção", "In production") : label(locale, "Beta fechado", "Closed beta");
const statusClass = (status: Project["status"]) => status === "production" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300";

function StatusBadge({ status, locale }: { status: Project["status"]; locale: Locale }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current"/>{statusLabel(status, locale)}</span>;
}

function StackChips({ stack, limit }: { stack: string[]; limit?: number }) {
  const items = limit ? stack.slice(0, limit) : stack;
  return <ul className="flex flex-wrap gap-2">{items.map(item => <li key={item} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{item}</li>)}{limit && stack.length > limit && <li className="px-1 py-1 text-xs font-semibold text-[var(--muted)]">+{stack.length - limit}</li>}</ul>;
}

export function ProjectCard({ project, locale, priority = false }: { project: Project; locale: Locale; priority?: boolean }) {
  const metric = project.metrics[0];
  return <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-1">
    <Link href={`/projetos/${project.slug}`} className="relative block aspect-[19/10] overflow-hidden bg-[var(--brand-soft)]" aria-label={label(locale, `Ver projeto ${project.name}`, `View ${project.name} project`)}>
      {project.cover
        ? <Image src={project.cover.src} alt={t(project.cover.alt, locale)} fill priority={priority} sizes="(max-width: 767px) 100vw, 50vw" className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"/>
        : <span aria-hidden="true" className="grid size-full place-items-center text-6xl font-semibold tracking-tight text-[var(--brand)]">{project.name.slice(0, 2)}</span>}
    </Link>
    <div className="flex flex-1 flex-col p-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge status={project.status} locale={locale}/><span className="eyebrow">{t(project.role, locale)}</span></div>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">{project.name}</h3>
      <p className="mt-2 flex-1 leading-7 text-[var(--muted)]">{t(project.tagline, locale)}</p>
      <div className="mt-5"><StackChips stack={project.stack} limit={5}/></div>
      {metric && <p className="mt-5 text-sm text-[var(--muted)]"><strong className="text-lg text-[var(--ink)]">{metric.value}</strong> {t(metric.label, locale)}</p>}
      <Link href={`/projetos/${project.slug}`} className="mt-5 inline-flex items-center gap-1 font-bold text-[var(--brand)] underline-offset-4 hover:underline">{label(locale, "Ver detalhes do projeto", "See project details")}<ArrowUpRight aria-hidden="true" size={16}/></Link>
    </div>
  </article>;
}

export function ProjectsGrid({ projects, locale, embedded = false }: { projects: Project[]; locale: Locale; embedded?: boolean }) {
  return <div className={embedded ? "grid gap-5 md:grid-cols-2" : "shell grid gap-5 py-14 md:grid-cols-2 md:py-20"}>{projects.map((project, index) => <ProjectCard key={project.slug} project={project} locale={locale} priority={index < 2}/>)}</div>;
}

function AiSection({ ai, locale }: { ai: NonNullable<Project["ai"]>; locale: Locale }) {
  return <section className="shell pb-12 md:pb-20" aria-label={t(ai.title, locale)}>
    <h2 className="text-3xl font-semibold tracking-tight">{t(ai.title, locale)}</h2>
    <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{t(ai.intro, locale)}</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{ai.pillars.map(item => <article key={item.title.pt} className="card flex flex-col p-6"><h3 className="text-xl font-semibold">{t(item.title, locale)}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[var(--muted)]">{t(item.body, locale)}</p><ul className="mt-4 flex flex-wrap gap-2">{item.tags.map(tag => <li key={tag} className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">{tag}</li>)}</ul></article>)}</div>
  </section>;
}

function Roadmap({ roadmap, locale }: { roadmap: NonNullable<Project["roadmap"]>; locale: Locale }) {
  const { stats } = roadmap;
  const parts = [
    { key: "done", value: stats.done, color: "bg-emerald-500", name: label(locale, "Concluídas", "Done") },
    { key: "testing", value: stats.testing, color: "bg-sky-500", name: label(locale, "Em teste", "In testing") },
    { key: "building", value: stats.building, color: "bg-amber-500", name: label(locale, "Em desenvolvimento", "In development") },
    { key: "backlog", value: stats.backlog, color: "bg-[var(--line)]", name: label(locale, "Planejadas", "Planned") },
  ];
  const waveStatus = (status: "now" | "next" | "planned") => status === "now" ? label(locale, "Em teste agora", "Testing now") : status === "next" ? label(locale, "Em construção", "Being built") : label(locale, "Planejado", "Planned");
  return <section className="shell pb-12 md:pb-20" aria-label={t(roadmap.title, locale)}>
    <h2 className="text-3xl font-semibold tracking-tight">{t(roadmap.title, locale)}</h2>
    <p className="mt-3 max-w-2xl text-[var(--muted)]">{t(roadmap.intro, locale)}</p>
    <div className="card mt-8 p-6">
      <p className="text-sm text-[var(--muted)]"><strong className="text-3xl text-[var(--ink)]">{stats.total}</strong> {label(locale, "histórias de produto", "product stories")} · {label(locale, "posição em", "as of")} {new Date(roadmap.asof).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--line)]" role="img" aria-label={parts.map(part => `${part.name}: ${part.value}`).join(", ")}>{parts.map(part => <span key={part.key} className={part.color} style={{ width: `${(part.value / stats.total) * 100}%` }}/>)}</div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{parts.map(part => <li key={part.key} className="flex items-center gap-3"><span aria-hidden="true" className={`size-3 rounded-full ${part.color}`}/><span><strong className="text-xl">{part.value}</strong><span className="block text-sm text-[var(--muted)]">{part.name}</span></span></li>)}</ul>
    </div>
    <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{roadmap.waves.map(wave => <li key={wave.id} className="card p-6"><div className="flex items-center justify-between gap-2"><span className="eyebrow">{wave.id === "beta" ? "Beta" : wave.id}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${wave.status === "now" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : wave.status === "next" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : "bg-[var(--brand-soft)] text-[var(--muted)]"}`}>{waveStatus(wave.status)}</span></div><h3 className="mt-3 text-lg font-semibold">{t(wave.title, locale)}</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)]">{wave.items[locale].map(item => <li key={item}>- {item}</li>)}</ul></li>)}</ol>
  </section>;
}

export function ProjectPage({ project, locale }: { project: Project; locale: Locale }) {
  return <>
    <section className="shell py-14 md:py-20">
      <Link href="/projetos" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"><ChevronLeft aria-hidden="true" size={16}/>{label(locale, "Todos os projetos", "All projects")}</Link>
      <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3"><StatusBadge status={project.status} locale={locale}/><span className="eyebrow">{t(project.role, locale)} · {project.period}</span></div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] md:text-6xl">{project.name}</h1>
          <p className="mt-4 text-xl leading-8 text-[var(--brand)]">{t(project.tagline, locale)}</p>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">{t(project.summary, locale)}</p>
          <div className="mt-7 flex flex-wrap gap-3">{project.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-3 font-bold text-white">{t(link.label, locale)}<ArrowUpRight aria-hidden="true" size={16}/></a>)}</div>
        </div>
        {project.cover && <div className="card relative aspect-[19/10] overflow-hidden"><Image src={project.cover.src} alt={t(project.cover.alt, locale)} fill priority sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover object-top"/></div>}
      </div>
      {project.metrics.length > 0 && <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{project.metrics.map(metric => <div key={metric.value + metric.label.pt} className="card flex flex-col-reverse p-5"><dt className="mt-1 text-sm text-[var(--muted)]">{t(metric.label, locale)}</dt><dd className="text-3xl font-semibold tracking-tight text-[var(--brand)]">{metric.value}</dd></div>)}</dl>}
      {project.credit && <p className="card mt-6 p-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">{label(locale, "Autoria: ", "Credits: ")}</strong>{t(project.credit, locale)}</p>}
    </section>

    {project.gallery.length > 0 && <section className="shell pb-12 md:pb-16" aria-label={label(locale, "Telas do projeto", "Project screens")}>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">{label(locale, "Telas", "Screens")}</h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">{project.gallery.map(item => <li key={item.src} className="shrink-0 snap-start"><Image src={item.src} alt={t(item.alt, locale)} width={item.width} height={item.height} sizes="320px" className="h-[420px] w-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]"/></li>)}</ul>
    </section>}

    {project.panel.length > 0 && <section className="shell pb-12 md:pb-20" aria-label={label(locale, "Painel administrativo", "Admin panel")}>
      <h2 className="text-3xl font-semibold tracking-tight">{project.panelIntro ? t(project.panelIntro.title, locale) : label(locale, "Por dentro do painel", "Inside the admin panel")}</h2>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">{project.panelIntro ? t(project.panelIntro.text, locale) : label(locale, "Telas reais do painel interno, para entender como o produto funciona no dia a dia.", "Real screens of the internal panel, to show how the product works day to day.")}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">{project.panel.map(item => <figure key={item.src} className="card overflow-hidden"><Image src={item.src} alt={`${t(item.title, locale)}: ${t(item.caption, locale)}`} width={item.width} height={item.height} sizes="(max-width: 767px) 100vw, 50vw" className="h-auto w-full border-b border-[var(--line)]"/><figcaption className="p-5"><strong className="block text-lg">{t(item.title, locale)}</strong><span className="mt-2 block text-sm leading-6 text-[var(--muted)]">{t(item.caption, locale)}</span></figcaption></figure>)}</div>
    </section>}

    <section className="shell pb-12 md:pb-20">
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">{label(locale, "O que foi construído", "What was built")}</h2>
      <ul className="grid gap-3 md:grid-cols-2">{project.highlights[locale].map(item => <li key={item} className="card p-5 leading-7">{item}</li>)}</ul>
    </section>

    {project.decisions.length > 0 && <section className="shell pb-12 md:pb-20">
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">{label(locale, "Decisões técnicas", "Technical decisions")}</h2>
      <div className="grid gap-4 md:grid-cols-2">{project.decisions.map(item => <article key={item.title.pt} className="card p-6"><h3 className="text-xl font-semibold">{t(item.title, locale)}</h3><p className="mt-3 leading-7 text-[var(--muted)]">{t(item.body, locale)}</p></article>)}</div>
    </section>}

    {project.ai && <AiSection ai={project.ai} locale={locale}/>}

    {project.roadmap && <Roadmap roadmap={project.roadmap} locale={locale}/>}

    <section className="shell pb-16 md:pb-24">
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">Stack</h2>
      <StackChips stack={project.stack}/>
      <div className="mt-10 flex flex-wrap gap-4 font-bold underline underline-offset-4"><Link href="/projetos">{label(locale, "Voltar aos projetos", "Back to projects")}</Link><Link href="/contato">{label(locale, "Falar sobre um projeto", "Talk about a project")}</Link></div>
    </section>
  </>;
}
