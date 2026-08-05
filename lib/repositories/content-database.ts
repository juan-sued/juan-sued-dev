import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const contentViewSchema = z.enum(["published_experiences", "published_skills", "published_education"]);
export type ContentView = z.infer<typeof contentViewSchema>;

const viewColumns: Record<ContentView, string[]> = {
  published_experiences: ["id", "company", "role_pt", "role_en", "period_pt", "period_en", "responsibilities_pt", "responsibilities_en", "start_date", "end_date", "current"],
  published_skills: ["id", "category", "items"],
  published_education: ["id", "institution", "course_pt", "course_en", "description_pt", "description_en"],
};

export async function readContentRows(view: ContentView): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(view).select(viewColumns[view].join(",")).order("display_order");
  if (error) throw new Error(`Unable to load ${view}: ${error.message}`);
  return (data ?? []) as unknown as Record<string, unknown>[];
}
