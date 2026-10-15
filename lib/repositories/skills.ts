import { z } from "zod";
import data from "@/content/data/skills.json";
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
  return skillSchema.array().parse(data.map((row) => {
    const value = skillViewSchema.parse(row);
    return { category: categories[value.category], items: value.items };
  }));
}
