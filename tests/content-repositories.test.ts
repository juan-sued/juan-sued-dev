import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { getContentSource } from "../lib/repositories/content-source";
import { getEducation } from "../lib/repositories/education";
import { getExperiences } from "../lib/repositories/experiences";
import { getSkills } from "../lib/repositories/skills";
import { education, experiences, skills } from "../content/data";

const originalSource = process.env.CMS_CONTENT_SOURCE;
afterEach(() => {
  if (originalSource === undefined) delete process.env.CMS_CONTENT_SOURCE;
  else process.env.CMS_CONTENT_SOURCE = originalSource;
  vi.clearAllMocks();
});

function database(data: unknown) {
  const order = vi.fn().mockResolvedValue({ data, error: null });
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  mocks.createClient.mockResolvedValue({ from });
  return { from, select, order };
}

describe("CMS1 content repositories", () => {
  it("uses code source by default and for invalid values", () => {
    expect(getContentSource()).toBe("code");
    expect(getContentSource("invalid")).toBe("code");
    expect(getContentSource("database")).toBe("database");
  });

  it("preserves current code content through repository source", async () => {
    delete process.env.CMS_CONTENT_SOURCE;
    await expect(getExperiences()).resolves.toEqual(experiences);
    await expect(getSkills()).resolves.toEqual([
      { category: { pt: "Frontend e Mobile", en: "Frontend and Mobile" }, items: skills[0][1] },
      { category: { pt: "Backend", en: "Backend" }, items: skills[1][1] },
      { category: { pt: "Dados", en: "Data" }, items: skills[2][1] },
      { category: { pt: "Geolocalização", en: "Geolocation" }, items: skills[3][1] },
      { category: { pt: "Qualidade & Entrega", en: "Quality and Delivery" }, items: skills[4][1] },
    ]);
    await expect(getEducation()).resolves.toEqual(education);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("queries ordered database rows when database source enabled", async () => {
    process.env.CMS_CONTENT_SOURCE = "database";
    const db = database([{ category_pt: "Backend", category_en: "Backend", items: "Node.js" }]);
    await expect(getSkills()).resolves.toEqual([{ category: { pt: "Backend", en: "Backend" }, items: "Node.js" }]);
    expect(db.from).toHaveBeenCalledWith("published_skills");
    expect(db.select).toHaveBeenCalledWith("*");
    expect(db.order).toHaveBeenCalledWith("sort_order");
  });

  it("maps experience and education database rows", async () => {
    process.env.CMS_CONTENT_SOURCE = "database";
    database([{ company: "Acme", role_pt: "Dev", role_en: "Developer", period_pt: "Hoje", period_en: "Today", points_pt: ["Entrega"], points_en: ["Ships"] }]);
    await expect(getExperiences()).resolves.toEqual([{ company: "Acme", role: { pt: "Dev", en: "Developer" }, period: { pt: "Hoje", en: "Today" }, points: { pt: ["Entrega"], en: ["Ships"] } }]);
    database([{ institution: "Uni", program_pt: "Computação", program_en: "Computer Science", detail_pt: "2025", detail_en: "2025" }]);
    await expect(getEducation()).resolves.toEqual([{ institution: "Uni", degree: { pt: "Computação", en: "Computer Science" }, detail: { pt: "2025", en: "2025" } }]);
  });

  it("rejects invalid database content", async () => {
    process.env.CMS_CONTENT_SOURCE = "database";
    database([{ category_pt: "Backend", category_en: "Backend", items: 1 }]);
    await expect(getSkills()).rejects.toThrow();
  });
});
