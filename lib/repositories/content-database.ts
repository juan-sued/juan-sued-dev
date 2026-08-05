import { createClient } from "@/lib/supabase/server";

export async function readContentRows(view: "published_experiences" | "published_skills" | "published_education") {
  const supabase = await createClient();
  const { data, error } = await supabase.from(view).select("*").order("sort_order");
  if (error) throw new Error(`Unable to load ${view}: ${error.message}`);
  return data ?? [];
}
