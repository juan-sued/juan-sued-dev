import { z } from "zod";
import type { Locale } from "@/lib/locale";
import data from "@/content/data/certifications.json";

export const certificationCategorySchema = z.enum(["frontend", "backend", "database", "mobile", "cloud", "devops", "architecture", "quality", "general"]);
export type CertificationCategory = z.infer<typeof certificationCategorySchema>;

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
  pdf_url: z.string().min(1),
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
  pdfUrl: z.string().min(1),
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

export async function getPublishedCertifications(): Promise<PublicCertificationDTO[]> {
  const rows = data.map(({ storage_path, ...row }) => ({ ...row, pdf_url: `/certifications/${storage_path}` }));
  return publicCertificationDTOSchema.array().parse(rows).sort((a, b) => a.display_order - b.display_order);
}

export async function getFeaturedCertifications(): Promise<PublicCertificationDTO[]> {
  return (await getPublishedCertifications()).filter(item => item.featured);
}
