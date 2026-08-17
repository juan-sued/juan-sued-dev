import { createClient as createPublicClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Copy } from "@/lib/locale";

function createAnonymousClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase public credentials are not configured");
  return createPublicClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const profileRowSchema = z.object({
  name: z.string(),
  role_pt: z.string(),
  role_en: z.string(),
  intro_pt: z.string(),
  intro_en: z.string(),
  location_pt: z.string(),
  location_en: z.string(),
  link_bikerway: z.string().nullable(),
  link_event_horizon: z.string().nullable(),
  link_linkedin: z.string().nullable(),
  link_github: z.string().nullable(),
  link_email: z.string().nullable(),
});

export type SiteProfile = {
  name: string;
  role: Copy;
  intro: Copy;
  location: Copy;
  links: { bikerway: string; eventHorizon: string; linkedin: string; github: string; email: string };
};

export async function getProfile(): Promise<SiteProfile> {
  const supabase = createAnonymousClient();
  const { data, error } = await supabase.from("published_site_profile").select("*").maybeSingle();
  if (error) throw new Error(`Unable to load profile: ${error.message}`);
  if (!data) throw new Error("Site profile is not configured");
  const row = profileRowSchema.parse(data);
  return {
    name: row.name,
    role: { pt: row.role_pt, en: row.role_en },
    intro: { pt: row.intro_pt, en: row.intro_en },
    location: { pt: row.location_pt, en: row.location_en },
    links: {
      bikerway: row.link_bikerway ?? "",
      eventHorizon: row.link_event_horizon ?? "",
      linkedin: row.link_linkedin ?? "",
      github: row.link_github ?? "",
      email: row.link_email ?? "",
    },
  };
}
