import { z } from "zod";

export const localeSchema = z.enum(["pt", "en"]);
export type Locale = z.infer<typeof localeSchema>;

const textSchema = z.string().trim().min(1);

export const copySchema = z.object({ pt: textSchema, en: textSchema });
export type Copy = z.infer<typeof copySchema>;

export const skillCategorySchema = z.enum(["frontend_mobile", "backend", "data", "geolocation", "quality_delivery"]);
export type SkillCategory = z.infer<typeof skillCategorySchema>;

export const experienceSchema = z.object({
  company: textSchema,
  role: copySchema,
  period: copySchema,
  points: z.object({ pt: z.array(textSchema), en: z.array(textSchema) }),
});
export type Experience = z.infer<typeof experienceSchema>;

export const skillSchema = z.object({ category: copySchema, items: textSchema });
export type Skill = z.infer<typeof skillSchema>;

export const educationSchema = z.object({ institution: textSchema, degree: copySchema, detail: copySchema });
export type Education = z.infer<typeof educationSchema>;
