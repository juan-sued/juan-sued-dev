import type { Locale } from "@/lib/locale";
import { certificationViews, getPublishedCertifications, type CertificationView } from "@/lib/repositories/certifications";

export async function loadCertifications(locale: Locale, recruiter: boolean): Promise<CertificationView[]> {
  return certificationViews(await getPublishedCertifications(), { locale, recruiter });
}
