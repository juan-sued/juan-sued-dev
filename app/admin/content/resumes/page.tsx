import { AdminShell } from "@/components/admin-shell";
import { ResumeUploadForm } from "@/components/admin/resume-upload-form";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminResumes } from "./actions";

const labels = { ats: "Currículo ATS", visual: "Currículo visual" };

export default async function ResumesPage() {
  const admin = await requireAdmin();
  const resumes = await listAdminResumes();
  return (
    <AdminShell email={admin.email}>
      <p className="text-sm text-[var(--muted)]">Administração / Conteúdo / Currículos</p>
      <h1 className="mt-2 text-3xl font-bold">Currículos</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">PDFs baixados pelo site público (home, menu de comandos e /curriculo). Enviar um novo arquivo substitui o atual imediatamente.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {resumes.map(resume => (
          <div key={resume.kind} className="rounded-xl border border-[var(--line)] p-5">
            <h2 className="font-semibold">{labels[resume.kind]}</h2>
            {resume.storage_path ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Atualizado em {resume.updated_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(resume.updated_at)) : "-"}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">Nenhum arquivo enviado ainda.</p>
            )}
            <div className="mt-4"><ResumeUploadForm kind={resume.kind} /></div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
