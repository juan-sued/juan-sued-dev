import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ publicClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.publicClient }));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

import { getCases } from "../lib/repositories/cases";
import { getProfile } from "../lib/repositories/profile";

afterEach(() => vi.clearAllMocks());

const caseRow = {
  id: "00000000-0000-4000-8000-000000000010",
  slug: "h3",
  title_pt: "Mapas operacionais com H3",
  title_en: "Operational maps with H3",
  tag: "H3 / Mapas",
  summary_pt: "Resumo pt",
  summary_en: "Summary en",
  decision_pt: "Decisão pt",
  decision_en: "Decision en",
  stack: "H3 · deck.gl · Google Maps",
  sections_pt: [["Contexto", "texto"]],
  sections_en: [["Context", "text"]],
  display_order: 0,
};

function casesClient(rows: unknown[]) {
  const query = { order: vi.fn(async () => ({ data: rows, error: null })) };
  const from = vi.fn(() => ({ select: vi.fn(() => query) }));
  mocks.publicClient.mockReturnValue({ from });
  return { from };
}

function profileClient(row: unknown) {
  const query = { maybeSingle: vi.fn(async () => ({ data: row, error: null })) };
  const from = vi.fn(() => ({ select: vi.fn(() => query) }));
  mocks.publicClient.mockReturnValue({ from });
  return { from };
}

describe("public portfolio content", () => {
  it("publishes all technical case studies in order", async () => {
    const modules = ["estado", "offline", "localizacao", "chat", "ocr"].map((slug, index) => ({ ...caseRow, slug, display_order: index + 1 }));
    casesClient([caseRow, ...modules]);
    const cases = await getCases();
    expect(cases.map(item => item.slug)).toEqual(["h3", "estado", "offline", "localizacao", "chat", "ocr"]);
  });

  it("has bilingual case content", async () => {
    casesClient([caseRow]);
    const cases = await getCases();
    for (const item of cases) {
      expect(item.title.pt).not.toEqual(item.title.en);
      expect(item.sections.pt.length).toBeGreaterThan(0);
      expect(item.sections.en.length).toBeGreaterThan(0);
    }
  });

  it("keeps public links explicit and secure-ready", async () => {
    profileClient({
      name: "Juan Sued",
      role_pt: "Desenvolvedor", role_en: "Developer",
      intro_pt: "Intro", intro_en: "Intro",
      location_pt: "Rio de Janeiro, Brasil", location_en: "Rio de Janeiro, Brazil",
      link_bikerway: "https://bikerway.com.br/",
      link_event_horizon: "https://event-horizon-by-juan-sued.vercel.app/",
      link_linkedin: "https://www.linkedin.com/in/juan-sued/",
      link_github: "https://github.com/juan-sued",
      link_email: "mailto:juansued19@gmail.com",
    });
    const profile = await getProfile();
    expect(profile.links.bikerway).toBe("https://bikerway.com.br/");
    expect(profile.links.eventHorizon).toContain("vercel.app");
    expect(profile.links.linkedin).toContain("linkedin.com");
    expect(profile.links.github).toContain("github.com");
  });
});
