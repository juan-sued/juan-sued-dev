import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/locale";
import type { CertificationView } from "@/lib/repositories/certifications";

export function CertificationCard({ cert, locale }: { cert: CertificationView; locale: Locale }) {
  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";
  const completed = new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${cert.completedAt}T00:00:00Z`));
  const hours = cert.workloadHours == null
    ? null
    : locale === "pt"
      ? cert.workloadHours === 1 ? "1 hora" : `${cert.workloadHours} horas`
      : cert.workloadHours === 1 ? "1 hour" : `${cert.workloadHours} hours`;
  const linkLabel = locale === "pt" ? "Ver certificado" : "View certificate";
  const newTab = locale === "pt" ? "abre em nova aba" : "opens in new tab";

  return (
    <article className="card flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{cert.category}</p>
        {cert.featured && <span className="rounded-full border border-[var(--line)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-bold text-[var(--brand)]">{locale === "pt" ? "Em destaque" : "Featured"}</span>}
      </div>
      <h3 className="mt-2 text-xl font-semibold">{cert.title}</h3>
      <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{cert.issuer}</p>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{locale === "pt" ? "Concluído em" : "Completed in"} {completed}</p>
      {hours && <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{hours}</p>}
      <div className="mt-6 flex-1" />
      <a
        href={cert.pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${linkLabel} ${cert.title} — ${newTab}`}
        className="inline-flex w-fit items-center gap-1 font-bold text-[var(--brand)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
      >
        {linkLabel}
        <ArrowUpRight aria-hidden="true" size={15} />
        <span className="sr-only"> — {newTab}</span>
      </a>
    </article>
  );
}
