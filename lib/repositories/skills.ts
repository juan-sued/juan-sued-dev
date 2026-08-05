import { skills as codeSkills } from "@/content/data";
import { readContentRows } from "./content-database";
import { getContentSource } from "./content-source";
import { skillSchema, type Skill } from "./content-types";

const categories = [
  { pt: "Frontend e Mobile", en: "Frontend and Mobile" },
  { pt: "Backend", en: "Backend" },
  { pt: "Dados", en: "Data" },
  { pt: "Geolocalização", en: "Geolocation" },
  { pt: "Qualidade & Entrega", en: "Quality and Delivery" },
] as const;

export async function getSkills(): Promise<Skill[]> {
  if (getContentSource() === "code") return skillSchema.array().parse(codeSkills.map(([, items], index) => ({ category: categories[index], items })));
  const rows = await readContentRows("published_skills");
  return skillSchema.array().parse(rows.map((row) => {
    const value = row as Record<string, unknown>;
    return { category: { pt: value.category_pt, en: value.category_en }, items: value.items };
  }));
}
