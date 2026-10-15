import { z } from "zod";
import type { Copy } from "@/lib/locale";
import data from "@/content/data/projects.json";

const rowSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  status: z.enum(["production", "beta"]),
  period: z.string(),
  tagline_pt: z.string(),
  tagline_en: z.string(),
  role_pt: z.string(),
  role_en: z.string(),
  summary_pt: z.string(),
  summary_en: z.string(),
  highlights_pt: z.array(z.string()),
  highlights_en: z.array(z.string()),
  decisions: z.array(z.object({ title_pt: z.string(), title_en: z.string(), body_pt: z.string(), body_en: z.string() })),
  stack: z.array(z.string()),
  metrics: z.array(z.object({ label_pt: z.string(), label_en: z.string(), value: z.string() })),
  credit_pt: z.string().optional(),
  credit_en: z.string().optional(),
  links: z.array(z.object({ label_pt: z.string(), label_en: z.string(), url: z.string().url() })),
  cover: z.string().nullable(),
  cover_alt_pt: z.string(),
  cover_alt_en: z.string(),
  gallery: z.array(z.object({ src: z.string(), width: z.number().int().positive(), height: z.number().int().positive(), alt_pt: z.string(), alt_en: z.string() })),
  ai: z.object({ title_pt: z.string(), title_en: z.string(), intro_pt: z.string(), intro_en: z.string(), pillars: z.array(z.object({ title_pt: z.string(), title_en: z.string(), body_pt: z.string(), body_en: z.string(), tags: z.array(z.string()) })) }).optional(),
  roadmap: z.object({
    asof: z.string(),
    stats: z.object({ total: z.number().int(), done: z.number().int(), testing: z.number().int(), building: z.number().int(), backlog: z.number().int() }),
    title_pt: z.string(), title_en: z.string(), intro_pt: z.string(), intro_en: z.string(),
    waves: z.array(z.object({ id: z.string(), status: z.enum(["now", "next", "planned"]), title_pt: z.string(), title_en: z.string(), items_pt: z.array(z.string()), items_en: z.array(z.string()) })),
  }).optional(),
  panel_title_pt: z.string().optional(),
  panel_title_en: z.string().optional(),
  panel_intro_pt: z.string().optional(),
  panel_intro_en: z.string().optional(),
  panel: z.array(z.object({ src: z.string(), width: z.number().int().positive(), height: z.number().int().positive(), title_pt: z.string(), title_en: z.string(), caption_pt: z.string(), caption_en: z.string() })),
});

export type ProjectStatus = z.infer<typeof rowSchema>["status"];

export type Project = {
  slug: string;
  name: string;
  status: ProjectStatus;
  period: string;
  tagline: Copy;
  role: Copy;
  summary: Copy;
  highlights: { pt: string[]; en: string[] };
  decisions: { title: Copy; body: Copy }[];
  stack: string[];
  metrics: { label: Copy; value: string }[];
  credit: Copy | null;
  links: { label: Copy; url: string }[];
  cover: { src: string; alt: Copy } | null;
  gallery: { src: string; width: number; height: number; alt: Copy }[];
  ai: { title: Copy; intro: Copy; pillars: { title: Copy; body: Copy; tags: string[] }[] } | null;
  roadmap: { asof: string; stats: { total: number; done: number; testing: number; building: number; backlog: number }; title: Copy; intro: Copy; waves: { id: string; status: "now" | "next" | "planned"; title: Copy; items: { pt: string[]; en: string[] } }[] } | null;
  panelIntro: { title: Copy; text: Copy } | null;
  panel: { src: string; width: number; height: number; title: Copy; caption: Copy }[];
};

export async function getProjects(): Promise<Project[]> {
  return rowSchema.array().parse(data).map(row => ({
    slug: row.slug,
    name: row.name,
    status: row.status,
    period: row.period,
    tagline: { pt: row.tagline_pt, en: row.tagline_en },
    role: { pt: row.role_pt, en: row.role_en },
    summary: { pt: row.summary_pt, en: row.summary_en },
    highlights: { pt: row.highlights_pt, en: row.highlights_en },
    decisions: row.decisions.map(item => ({ title: { pt: item.title_pt, en: item.title_en }, body: { pt: item.body_pt, en: item.body_en } })),
    stack: row.stack,
    metrics: row.metrics.map(item => ({ label: { pt: item.label_pt, en: item.label_en }, value: item.value })),
    credit: row.credit_pt && row.credit_en ? { pt: row.credit_pt, en: row.credit_en } : null,
    links: row.links.map(item => ({ label: { pt: item.label_pt, en: item.label_en }, url: item.url })),
    cover: row.cover ? { src: row.cover, alt: { pt: row.cover_alt_pt, en: row.cover_alt_en } } : null,
    gallery: row.gallery.map(item => ({ src: item.src, width: item.width, height: item.height, alt: { pt: item.alt_pt, en: item.alt_en } })),
    ai: row.ai ? { title: { pt: row.ai.title_pt, en: row.ai.title_en }, intro: { pt: row.ai.intro_pt, en: row.ai.intro_en }, pillars: row.ai.pillars.map(item => ({ title: { pt: item.title_pt, en: item.title_en }, body: { pt: item.body_pt, en: item.body_en }, tags: item.tags })) } : null,
    roadmap: row.roadmap ? { asof: row.roadmap.asof, stats: row.roadmap.stats, title: { pt: row.roadmap.title_pt, en: row.roadmap.title_en }, intro: { pt: row.roadmap.intro_pt, en: row.roadmap.intro_en }, waves: row.roadmap.waves.map(wave => ({ id: wave.id, status: wave.status, title: { pt: wave.title_pt, en: wave.title_en }, items: { pt: wave.items_pt, en: wave.items_en } })) } : null,
    panelIntro: row.panel_title_pt && row.panel_title_en && row.panel_intro_pt && row.panel_intro_en ? { title: { pt: row.panel_title_pt, en: row.panel_title_en }, text: { pt: row.panel_intro_pt, en: row.panel_intro_en } } : null,
    panel: row.panel.map(item => ({ src: item.src, width: item.width, height: item.height, title: { pt: item.title_pt, en: item.title_en }, caption: { pt: item.caption_pt, en: item.caption_en } })),
  }));
}

export async function getProject(slug: string): Promise<Project | null> {
  return (await getProjects()).find(project => project.slug === slug) ?? null;
}
