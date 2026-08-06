import { unstable_cache } from "next/cache";
import type { Locale } from "@/content/data";
import { certificationViews, getPublishedCertifications, type CertificationView } from "@/lib/repositories/certifications";

export const PORTFOLIO_CERTIFICATIONS_TAG = "portfolio:certifications";

export function getCachedPublishedCertifications(): Promise<Awaited<ReturnType<typeof getPublishedCertifications>>> {
  return unstable_cache(
    async () => getPublishedCertifications(),
    ["certifications", "published"],
    { tags: [PORTFOLIO_CERTIFICATIONS_TAG], revalidate: 3600 },
  )();
}

export async function loadCertifications(locale: Locale, recruiter: boolean): Promise<CertificationView[]> {
  try {
    const dtos = await getCachedPublishedCertifications();
    return certificationViews(dtos, { locale, recruiter });
  } catch (error) {
    console.error("[certifications] unable to load published certifications:", error instanceof Error ? error.message : error);
    return [];
  }
}
