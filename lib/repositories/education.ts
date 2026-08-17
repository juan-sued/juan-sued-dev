import { z } from "zod";
import { readContentRows } from "./content-database";
import { educationSchema, type Education } from "./content-types";

const educationViewSchema = z.object({ institution: z.string(), course_pt: z.string(), course_en: z.string(), description_pt: z.string(), description_en: z.string() });

export async function getEducation(): Promise<Education[]> {
  const rows = await readContentRows("published_education");
  return educationSchema.array().parse(rows.map((row) => {
    const value = educationViewSchema.parse(row);
    return {
      institution: value.institution,
      degree: { pt: value.course_pt, en: value.course_en },
      detail: { pt: value.description_pt, en: value.description_en },
    };
  }));
}
