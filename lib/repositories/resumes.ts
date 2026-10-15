import { z } from "zod";
import data from "@/content/data/resumes.json";

export const resumeKindSchema = z.enum(["ats", "visual"]);
export type ResumeKind = z.infer<typeof resumeKindSchema>;

export type ResumeUrls = Record<ResumeKind, string | null>;

export async function getResumeUrls(): Promise<ResumeUrls> {
  const parsed = z.object({ ats: z.string().optional(), visual: z.string().optional() }).parse(data);
  return { ats: parsed.ats ?? null, visual: parsed.visual ?? null };
}
