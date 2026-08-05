import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin-shell";
import { OpportunityForm } from "@/components/opportunity-form";
import { OpportunitySensitiveActions } from "@/components/admin/crm-sensitive-actions";
export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) { const admin=await requireAdmin(); const {id}=await params; const supabase=await createClient(); const {data}=await supabase.from("opportunities").select("*").eq("id",id).maybeSingle(); if(!data) notFound(); return <AdminShell email={admin.email}><Link href="/admin/crm/opportunities" className="text-sm font-semibold">← Oportunidades</Link><h1 className="mt-3 text-3xl font-bold">{data.title}</h1>{data.contact_id&&<Link href={`/admin/crm/contacts/${data.contact_id}`} className="mt-2 block text-sm font-semibold">Abrir contato vinculado</Link>}{data.job_url&&<a href={data.job_url} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold">Abrir vaga</a>}<OpportunityForm opportunity={data}/><OpportunitySensitiveActions id={id} closedAt={data.closed_at} contactId={data.contact_id}/></AdminShell>; }
