import { experiences as codeExperiences } from "@/content/data";
import { readContentRows } from "./content-database";
import { getContentSource } from "./content-source";
import { experienceSchema, type Experience } from "./content-types";

export async function getExperiences(): Promise<Experience[]> {
  if (getContentSource() === "code") return experienceSchema.array().parse(codeExperiences);
  const rows = await readContentRows("published_experiences");
  return experienceSchema.array().parse(rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      company: value.company,
      role: { pt: value.role_pt, en: value.role_en },
      period: { pt: value.period_pt, en: value.period_en },
      points: { pt: value.points_pt, en: value.points_en },
    };
  }));
}
