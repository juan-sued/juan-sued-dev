import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/admin-shell";
import { CertificationForm } from "@/components/admin/certification-form";
import { CertificationSensitiveActions } from "@/components/admin/certification-actions";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminCertificationById, listCertificationStorageFiles } from "@/lib/repositories/certifications";

export default async function CertificationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const certification = await getAdminCertificationById(id);
  if (!certification) notFound();
  const existingFiles = await listCertificationStorageFiles().catch(() => []);
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/content/certifications" className="text-sm font-semibold">← Certificações</Link>
      <h1 className="mt-3 text-3xl font-bold">{certification.title_pt}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{certification.issuer} · {certification.category} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${certification.completed_at}T00:00:00Z`))}</p>
      <a href={certification.public_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold">Abrir PDF</a>
      <CertificationForm certification={certification} existingFiles={existingFiles} />
      <CertificationSensitiveActions id={certification.id} publicationStatus={certification.publication_status} />
    </AdminShell>
  );
}
