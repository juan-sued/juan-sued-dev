import { z } from "zod";

export const localeSchema = z.enum(["pt", "en"]);
export type Locale = z.infer<typeof localeSchema>;

const textSchema = z.string().trim().min(1);
const dateSchema = z.string().date();

export const copySchema = z.object({ pt: textSchema, en: textSchema });
export type Copy = z.infer<typeof copySchema>;

export const publicationStatusSchema = z.enum(["draft", "published", "archived"]);
export const skillCategorySchema = z.enum(["frontend_mobile", "backend", "data", "geolocation", "quality_delivery"]);
export type SkillCategory = z.infer<typeof skillCategorySchema>;

export const experienceDraftSchema = z.object({
  company: textSchema,
  role: copySchema,
  summary: copySchema.nullable(),
  description: copySchema.nullable(),
  responsibilities: z.object({ pt: z.array(textSchema), en: z.array(textSchema) }),
  startDate: dateSchema.nullable(),
  endDate: dateSchema.nullable(),
  current: z.boolean(),
  location: copySchema.nullable(),
  employmentType: textSchema.nullable(),
  technologies: z.array(textSchema),
  displayOrder: z.number().int().nonnegative(),
  featured: z.boolean(),
  recruiterVisible: z.boolean(),
  publicationStatus: publicationStatusSchema,
});

export const experiencePublishSchema = experienceDraftSchema.extend({
  summary: copySchema,
  description: copySchema,
  responsibilities: z.object({ pt: z.array(textSchema).min(1), en: z.array(textSchema).min(1) }),
  publicationStatus: z.literal("published"),
});

export const experienceSchema = z.object({
  company: textSchema,
  role: copySchema,
  period: copySchema,
  points: z.object({ pt: z.array(textSchema), en: z.array(textSchema) }),
});
export type Experience = z.infer<typeof experienceSchema>;

export const skillDraftSchema = z.object({
  name: copySchema.nullable(),
  category: skillCategorySchema,
  displayOrder: z.number().int().nonnegative(),
  featured: z.boolean(),
  recruiterVisible: z.boolean(),
  publicationStatus: publicationStatusSchema,
});

export const skillPublishSchema = skillDraftSchema.extend({
  name: copySchema,
  publicationStatus: z.literal("published"),
});

export const skillSchema = z.object({ category: copySchema, items: textSchema });
export type Skill = z.infer<typeof skillSchema>;

export const educationDraftSchema = z.object({
  institution: textSchema,
  course: copySchema.nullable(),
  description: copySchema.nullable(),
  startDate: dateSchema.nullable(),
  endDate: dateSchema.nullable(),
  current: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  publicationStatus: publicationStatusSchema,
});

export const educationPublishSchema = educationDraftSchema.extend({
  course: copySchema,
  description: copySchema,
  publicationStatus: z.literal("published"),
});

export const educationSchema = z.object({ institution: textSchema, degree: copySchema, detail: copySchema });
export type Education = z.infer<typeof educationSchema>;

export const reorderInputSchema = z.object({ id: z.string().uuid(), displayOrder: z.number().int().nonnegative() });
export type ReorderInput = z.infer<typeof reorderInputSchema>;

export const archiveInputSchema = z.object({ id: z.string().uuid() });
export type ArchiveInput = z.infer<typeof archiveInputSchema>;

export const restoreInputSchema = z.object({ id: z.string().uuid() });
export type RestoreInput = z.infer<typeof restoreInputSchema>;
