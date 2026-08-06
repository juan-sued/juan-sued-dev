import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { CertificationForm } from "@/components/admin/certification-form";
import { requireAdmin } from "@/lib/auth/admin";
import { listCertificationStorageFiles } from "@/lib/repositories/certifications";

export default async function NewCertificationPage() {
  const admin = await requireAdmin();
  const existingFiles = await listCertificationStorageFiles().catch(() => []);
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/content/certifications" className="text-sm font-semibold">← Certificações</Link>
      <h1 className="mt-3 text-3xl font-bold">Nova certificação</h1>
      <CertificationForm existingFiles={existingFiles} />
    </AdminShell>
  );
}
