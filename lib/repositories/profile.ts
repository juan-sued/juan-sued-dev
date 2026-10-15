import { z } from "zod";
import type { Copy } from "@/lib/locale";
import data from "@/content/data/profile.json";

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
