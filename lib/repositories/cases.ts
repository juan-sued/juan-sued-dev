import { createClient as createPublicClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Copy, Locale } from "@/lib/locale";

function createAnonymousClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase public credentials are not configured");
  return createPublicClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const sectionSchema = z.tuple([z.string(), z.string()]);
const caseRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title_pt: z.string(),
  title_en: z.string(),
  tag: z.string(),
  summary_pt: z.string(),
  summary_en: z.string(),
  decision_pt: z.string(),
  decision_en: z.string(),
  stack: z.string(),
  sections_pt: z.array(sectionSchema),
  sections_en: z.array(sectionSchema),
  display_order: z.number().int(),
});

export type CaseStudy = {
  slug: string;
  title: Copy;
  tag: string;
  summary: Copy;
  decision: Copy;
  stack: string;
  sections: Record<Locale, [string, string][]>;
};

export async function getCases(): Promise<CaseStudy[]> {
  const supabase = createAnonymousClient();
  const { data, error } = await supabase.from("published_cases").select("*").order("display_order");
  if (error) throw new Error(`Unable to load cases: ${error.message}`);
  return caseRowSchema.array().parse(data ?? []).map(row => ({
    slug: row.slug,
    title: { pt: row.title_pt, en: row.title_en },
    tag: row.tag,
    summary: { pt: row.summary_pt, en: row.summary_en },
    decision: { pt: row.decision_pt, en: row.decision_en },
    stack: row.stack,
    sections: { pt: row.sections_pt, en: row.sections_en },
  }));
}
