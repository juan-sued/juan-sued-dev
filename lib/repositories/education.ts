import { education as codeEducation } from "@/content/data";
import { readContentRows } from "./content-database";
import { getContentSource } from "./content-source";
import { educationSchema, type Education } from "./content-types";

export async function getEducation(): Promise<Education[]> {
  if (getContentSource() === "code") return educationSchema.array().parse(codeEducation);
  const rows = await readContentRows("published_education");
  return educationSchema.array().parse(rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      institution: value.institution,
      degree: { pt: value.program_pt, en: value.program_en },
      detail: { pt: value.detail_pt, en: value.detail_en },
    };
  }));
}
