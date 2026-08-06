import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Locale } from "@/content/data";
import { createClient } from "@/lib/supabase/server";

function createAnonymousClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase public credentials are not configured");
  return createPublicClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const certificationCategorySchema = z.enum(["frontend", "backend", "database", "mobile", "cloud", "devops", "architecture", "quality", "general"]);
export type CertificationCategory = z.infer<typeof certificationCategorySchema>;

export const certificationPublicationStatusSchema = z.enum(["draft", "published", "archived"]);
export type CertificationPublicationStatus = z.infer<typeof certificationPublicationStatusSchema>;

export const certificationStoragePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(value => value.endsWith(".pdf"), { message: "Caminho deve terminar em .pdf." })
  .refine(value => !value.startsWith("/"), { message: "Caminho não pode começar com /." })
  .refine(value => !value.includes(".."), { message: "Caminho inválido." })
  .refine(value => !value.includes("?"), { message: "Caminho não pode conter consulta." })
  .refine(value => !value.includes(":"), { message: "Caminho não pode conter protocolo." });

const blank = z.preprocess(value => value === "" ? undefined : value, z.string().optional());
const checkbox = z.preprocess(value => value === "on" || value === "true", z.boolean());
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalWorkload = z.preprocess(value => value === "" ? undefined : value, z.coerce.number().positive().max(9999).optional());
const optionalHttpsUrl = z.preprocess(value => value === "" ? undefined : value, z.string().trim().url().refine(value => value.startsWith("https://"), { message: "URL deve ser HTTPS." }).optional());
const skills = z.string().transform(value => value.split("\n").map(item => item.trim()).filter(Boolean)).pipe(z.array(text(200)));

export const certificationRowSchema = z.object({
  id: z.string().uuid(),
  title_pt: z.string(),
  title_en: z.string(),
  issuer: z.string(),
  category: certificationCategorySchema,
  completed_at: z.string().date(),
  workload_hours: z.number().nullable(),
  storage_bucket: z.string(),
  storage_path: certificationStoragePathSchema,
  credential_url: z.string().nullable(),
  skills: z.array(z.string()),
  featured: z.boolean(),
  recruiter_visible: z.boolean(),
  display_order: z.number().int(),
  publication_status: certificationPublicationStatusSchema,
  published_at: z.string().nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  updated_by: z.string().uuid().nullable(),
});
export type CertificationRow = z.infer<typeof certificationRowSchema>;

export type CertificationAdminDTO = CertificationRow & { public_url: string };

export const publicCertificationDTOSchema = z.object({
  id: z.string().uuid(),
  title_pt: z.string(),
  title_en: z.string(),
  issuer: z.string(),
  category: certificationCategorySchema,
  completed_at: z.string().date(),
  workload_hours: z.number().nullable(),
  skills: z.array(z.string()),
  featured: z.boolean(),
  recruiter_visible: z.boolean(),
  display_order: z.number().int(),
  credential_url: z.string().nullable(),
  pdf_url: z.string().url(),
});
export type PublicCertificationDTO = z.infer<typeof publicCertificationDTOSchema>;

export const certificationViewSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  issuer: z.string(),
  category: z.string(),
  completedAt: z.string().date(),
  workloadHours: z.number().nullable(),
  featured: z.boolean(),
  pdfUrl: z.string().url(),
});
export type CertificationView = z.infer<typeof certificationViewSchema>;

const certificationCategoryLabels: Record<CertificationCategory, { pt: string; en: string }> = {
  frontend: { pt: "Front-end", en: "Front-end" },
  backend: { pt: "Back-end", en: "Back-end" },
  database: { pt: "Banco de Dados", en: "Database" },
  mobile: { pt: "Mobile", en: "Mobile" },
  cloud: { pt: "Cloud", en: "Cloud" },
  devops: { pt: "DevOps", en: "DevOps" },
  architecture: { pt: "Arquitetura", en: "Architecture" },
  quality: { pt: "Qualidade", en: "Quality" },
  general: { pt: "Geral", en: "General" },
};

export function certificationCategoryLabel(category: string, locale: Locale): string {
  const label = certificationCategoryLabels[category as CertificationCategory];
  return label ? label[locale] : category;
}

export type CertificationVisibility = { locale: Locale; recruiter: boolean };

export function featuredCertificationViews(views: CertificationView[]): CertificationView[] {
  return views.filter(view => view.featured);
}

export function certificationViews(dtos: PublicCertificationDTO[], { locale, recruiter }: CertificationVisibility): CertificationView[] {
  return dtos
    .filter(dto => !recruiter || dto.recruiter_visible === true)
    .map(dto => ({
      id: dto.id,
      title: locale === "en" && dto.title_en?.trim() ? dto.title_en : dto.title_pt,
      issuer: dto.issuer,
      category: certificationCategoryLabel(dto.category, locale),
      completedAt: dto.completed_at,
      workloadHours: dto.workload_hours,
      featured: dto.featured,
      pdfUrl: dto.pdf_url,
    }));
}

export const certificationDraftInputSchema = z.object({
  id: blank.pipe(z.string().uuid().optional()),
  title_pt: text(200),
  title_en: text(200),
  issuer: text(160),
  category: certificationCategorySchema,
  completed_at: z.string().date(),
  workload_hours: optionalWorkload,
  storage_path: blank.pipe(certificationStoragePathSchema.optional()),
  credential_url: optionalHttpsUrl,
  skills,
  featured: checkbox,
  recruiter_visible: checkbox,
  display_order: z.coerce.number().int().nonnegative(),
  publication_status: certificationPublicationStatusSchema.default("draft"),
});
export type CertificationDraftInput = z.infer<typeof certificationDraftInputSchema>;

export const certificationPublishInputSchema = z.object({ id: z.string().uuid() });
export type CertificationPublishInput = z.infer<typeof certificationPublishInputSchema>;

export const certificationReorderInputSchema = z.object({ id: z.string().uuid(), display_order: z.coerce.number().int().nonnegative() });
export type CertificationReorderInput = z.infer<typeof certificationReorderInputSchema>;

export const certificationArchiveInputSchema = z.object({ id: z.string().uuid() });
export const certificationRestoreInputSchema = z.object({ id: z.string().uuid() });
export const certificationAttachInputSchema = z.object({ storage_path: certificationStoragePathSchema });

export const certificationUploadInputSchema = z.object({ file: z.instanceof(File) });

export type CertificationListFilters = {
  q?: string;
  publication_status?: string;
  category?: string;
  featured?: string;
};

const adminColumns = "id,title_pt,title_en,issuer,category,completed_at,workload_hours,storage_bucket,storage_path,credential_url,skills,featured,recruiter_visible,display_order,publication_status,published_at,archived_at,created_at,updated_at,updated_by";

function publicUrl(supabase: SupabaseClient, bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function toAdminDTO(supabase: SupabaseClient, row: CertificationRow): CertificationAdminDTO {
  return { ...row, public_url: publicUrl(supabase, row.storage_bucket, row.storage_path) };
}

export async function listAdminCertifications(filters: CertificationListFilters = {}): Promise<CertificationAdminDTO[]> {
  const supabase = await createClient();
  let query = supabase.from("certifications").select(adminColumns);
  if (filters.q) {
    const term = filters.q.replace(/[,%()]/g, "");
    if (term) query = query.or(`title_pt.ilike.%${term}%,title_en.ilike.%${term}%,issuer.ilike.%${term}%`);
  }
  if (filters.publication_status) query = query.eq("publication_status", filters.publication_status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.featured) query = query.eq("featured", filters.featured === "true");
  const { data, error } = await query.order("display_order").order("completed_at", { ascending: false });
  if (error) throw new Error(`Unable to list certifications: ${error.message}`);
  return certificationRowSchema.array().parse(data ?? []).map(row => toAdminDTO(supabase, row));
}

export async function getAdminCertificationById(id: string): Promise<CertificationAdminDTO | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("certifications").select(adminColumns).eq("id", id).maybeSingle();
  if (error) throw new Error(`Unable to load certification: ${error.message}`);
  if (!data) return null;
  return toAdminDTO(supabase, certificationRowSchema.parse(data));
}

export async function listCertificationStorageFiles(): Promise<string[]> {
  const supabase = await createClient();
  const files: string[] = [];
  const walk = async (folder: string) => {
    const { data, error } = await supabase.storage.from("certifications").list(folder);
    if (error) throw new Error(`Unable to list certification files: ${error.message}`);
    for (const item of data ?? []) {
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (item.metadata === null) await walk(path);
      else files.push(path);
    }
  };
  await walk("");
  return files.sort();
}

const publicRowSchema = z.object({
  id: z.string().uuid(),
  title_pt: z.string(),
  title_en: z.string(),
  issuer: z.string(),
  category: certificationCategorySchema,
  completed_at: z.string().date(),
  workload_hours: z.number().nullable(),
  skills: z.array(z.string()),
  featured: z.boolean(),
  recruiter_visible: z.boolean(),
  display_order: z.number().int(),
  credential_url: z.string().nullable(),
  storage_bucket: z.string(),
  storage_path: certificationStoragePathSchema,
});

export async function getPublishedCertifications(): Promise<PublicCertificationDTO[]> {
  // Fonte pública do portfólio: get_published_certifications_v2 (adiciona
  // recruiter_visible). A v1 permanece apenas para compatibilidade. Usa um
  // client anônimo sem cookies para ser compatível com unstable_cache (a
  // leitura é feita somente pela RPC pública, nunca na tabela base).
  const supabase = createAnonymousClient();
  const { data, error } = await supabase.rpc("get_published_certifications_v2");
  if (error) throw new Error(`Unable to load published certifications: ${error.message}`);
  return publicRowSchema.array().parse(data ?? []).map(row => ({
    id: row.id,
    title_pt: row.title_pt,
    title_en: row.title_en,
    issuer: row.issuer,
    category: row.category,
    completed_at: row.completed_at,
    workload_hours: row.workload_hours,
    skills: row.skills,
    featured: row.featured,
    recruiter_visible: row.recruiter_visible,
    display_order: row.display_order,
    credential_url: row.credential_url,
    pdf_url: publicUrl(supabase, row.storage_bucket, row.storage_path),
  }));
}

export async function getFeaturedCertifications(): Promise<PublicCertificationDTO[]> {
  return (await getPublishedCertifications()).filter(item => item.featured);
}
