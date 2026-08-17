import { z } from "zod";
import { readContentRows } from "./content-database";
import { skillCategorySchema, skillSchema, type Copy, type Skill, type SkillCategory } from "./content-types";

const categories: Record<SkillCategory, Copy> = {
  frontend_mobile: { pt: "Frontend e Mobile", en: "Frontend and Mobile" },
  backend: { pt: "Backend", en: "Backend" },
  data: { pt: "Dados", en: "Data" },
  geolocation: { pt: "Geolocalização", en: "Geolocation" },
  quality_delivery: { pt: "Qualidade & Entrega", en: "Quality and Delivery" },
};

const skillViewSchema = z.object({ category: skillCategorySchema, items: z.string() });

export async function getSkills(): Promise<Skill[]> {
  const rows = await readContentRows("published_skills");
  return skillSchema.array().parse(rows.map((row) => {
    const value = skillViewSchema.parse(row);
    return { category: categories[value.category], items: value.items };
  }));
}
