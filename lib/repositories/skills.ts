import { skills as codeSkills } from "@/content/data";
import { z } from "zod";
import { readContentRows } from "./content-database";
import { getContentSource } from "./content-source";
import { skillCategorySchema, skillSchema, type Copy, type Skill, type SkillCategory } from "./content-types";

const categories: Record<SkillCategory, Copy> = {
  frontend_mobile: { pt: "Frontend e Mobile", en: "Frontend and Mobile" },
  backend: { pt: "Backend", en: "Backend" },
  data: { pt: "Dados", en: "Data" },
  geolocation: { pt: "Geolocalização", en: "Geolocation" },
  quality_delivery: { pt: "Qualidade & Entrega", en: "Quality and Delivery" },
};

const codeSkillCategories = ["frontend_mobile", "backend", "data", "geolocation", "quality_delivery"] as const satisfies readonly SkillCategory[];
const skillViewSchema = z.object({ category: skillCategorySchema, items: z.string() });

export async function getSkills(): Promise<Skill[]> {
  if (getContentSource() === "code") return skillSchema.array().parse(codeSkills.map(([, items], index) => ({ category: categories[codeSkillCategories[index]], items })));
  const rows = await readContentRows("published_skills");
  return skillSchema.array().parse(rows.map((row) => {
    const value = skillViewSchema.parse(row);
    return { category: categories[value.category], items: value.items };
  }));
}
