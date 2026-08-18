import { createClient as createPublicClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

function createAnonymousClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase public credentials are not configured");
  return createPublicClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const resumeKindSchema = z.enum(["ats", "visual"]);
export type ResumeKind = z.infer<typeof resumeKindSchema>;

const resumeRowSchema = z.object({ kind: resumeKindSchema, storage_bucket: z.string(), storage_path: z.string() });

export type ResumeUrls = Record<ResumeKind, string | null>;

export async function getResumeUrls(): Promise<ResumeUrls> {
  const supabase = createAnonymousClient();
  const { data, error } = await supabase.from("published_resumes").select("*");
  if (error) throw new Error(`Unable to load resumes: ${error.message}`);
  const rows = resumeRowSchema.array().parse(data ?? []);
  const urls: ResumeUrls = { ats: null, visual: null };
  for (const row of rows) urls[row.kind] = supabase.storage.from(row.storage_bucket).getPublicUrl(row.storage_path).data.publicUrl;
  return urls;
}
