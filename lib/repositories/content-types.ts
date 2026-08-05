import { z } from "zod";

export const localeSchema = z.enum(["pt", "en"]);
export type Locale = z.infer<typeof localeSchema>;

export const copySchema = z.object({ pt: z.string(), en: z.string() });
export type Copy = z.infer<typeof copySchema>;

export const experienceSchema = z.object({
  company: z.string(),
  role: copySchema,
  period: copySchema,
  points: z.object({ pt: z.array(z.string()), en: z.array(z.string()) }),
});
export type Experience = z.infer<typeof experienceSchema>;

export const skillSchema = z.object({ category: copySchema, items: z.string() });
export type Skill = z.infer<typeof skillSchema>;

export const educationSchema = z.object({ institution: z.string(), degree: copySchema, detail: copySchema });
export type Education = z.infer<typeof educationSchema>;
