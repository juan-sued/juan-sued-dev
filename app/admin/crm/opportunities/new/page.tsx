import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin-shell";
import { OpportunityForm } from "@/components/opportunity-form";
export default async function NewOpportunityPage() { const admin = await requireAdmin(); return <AdminShell email={admin.email}><p className="text-sm text-[var(--muted)]">Administração / Oportunidades / Nova</p><h1 className="mt-2 text-3xl font-bold">Nova oportunidade</h1><OpportunityForm /></AdminShell>; }
