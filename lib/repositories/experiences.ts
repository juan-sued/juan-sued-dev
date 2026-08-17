import { z } from "zod";
import { readContentRows } from "./content-database";
import { experienceSchema, type Experience } from "./content-types";

const experienceViewSchema = z.object({
  company: z.string(),
  role_pt: z.string(),
  role_en: z.string(),
  responsibilities_pt: z.array(z.string()),
  responsibilities_en: z.array(z.string()),
  start_date: z.string().date().nullable(),
  end_date: z.string().date().nullable(),
  current: z.boolean(),
  period_pt: z.string().optional(),
  period_en: z.string().optional(),
});

function visualPeriod(value: z.infer<typeof experienceViewSchema>): Experience["period"] {
  if (value.period_pt && value.period_en) return { pt: value.period_pt, en: value.period_en };
  const start = value.start_date ?? "";
  const endPt = value.current ? "Atual" : value.end_date ?? "";
  const endEn = value.current ? "Present" : value.end_date ?? "";
  return { pt: [start, endPt].filter(Boolean).join(" - "), en: [start, endEn].filter(Boolean).join(" - ") };
}

export async function getExperiences(): Promise<Experience[]> {
  const rows = await readContentRows("published_experiences");
  return experienceSchema.array().parse(rows.map((row) => {
    const value = experienceViewSchema.parse(row);
    return {
      company: value.company,
      role: { pt: value.role_pt, en: value.role_en },
      period: visualPeriod(value),
      points: { pt: value.responsibilities_pt, en: value.responsibilities_en },
    };
  }));
}
