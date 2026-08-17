import Link from "next/link";
import type { Locale } from "@/content/data";
import type { CertificationView } from "@/lib/repositories/certifications";
import { CertificationCard } from "./certification-card";

export function CertificationsGrid({ certifications, locale, className = "" }: { certifications: CertificationView[]; locale: Locale; className?: string }) {
  if (certifications.length === 0) return null;
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {certifications.map(cert => <CertificationCard key={cert.id} cert={cert} locale={locale} />)}
    </div>
  );
}

export function CertificationsSection({ title, eyebrow, certifications, locale, className = "", viewAllHref }: { title: string; eyebrow?: string; certifications: CertificationView[]; locale: Locale; className?: string; viewAllHref?: string }) {
  if (certifications.length === 0) return null;
  return (
    <section className={`shell py-12 md:py-20 ${className}`}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="mb-8 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      <CertificationsGrid certifications={certifications} locale={locale} />
      {viewAllHref && <Link href={viewAllHref} className="mt-7 inline-block font-bold underline underline-offset-4">{locale === "pt" ? "Ver todas as certificações" : "View all certifications"}</Link>}
    </section>
  );
}
