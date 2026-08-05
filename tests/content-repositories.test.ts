import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { getContentSource } from "../lib/repositories/content-source";
import { getEducation } from "../lib/repositories/education";
import { getExperiences } from "../lib/repositories/experiences";
import { getSkills } from "../lib/repositories/skills";
import { archiveInputSchema, educationPublishSchema, experiencePublishSchema, reorderInputSchema, restoreInputSchema, skillPublishSchema } from "../lib/repositories/content-types";
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
    const db =     database([{ category: "backend", items: "Node.js" }]);
    await expect(getSkills()).resolves.toEqual([{ category: { pt: "Backend", en: "Backend" }, items: "Node.js" }]);
    expect(db.from).toHaveBeenCalledWith("published_skills");
    expect(db.select).toHaveBeenCalledWith("id,category,items");
    expect(db.order).toHaveBeenCalledWith("display_order");
  });

  it("maps structured database rows and uses legacy period only for display", async () => {
    process.env.CMS_CONTENT_SOURCE = "database";
    database([{ company: "Acme", role_pt: "Dev", role_en: "Developer", period_pt: "Hoje", period_en: "Today", responsibilities_pt: ["Entrega"], responsibilities_en: ["Ships"], start_date: "2025-01-01", end_date: null, current: true }]);
    await expect(getExperiences()).resolves.toEqual([{ company: "Acme", role: { pt: "Dev", en: "Developer" }, period: { pt: "Hoje", en: "Today" }, points: { pt: ["Entrega"], en: ["Ships"] } }]);
    database([{ institution: "Uni", course_pt: "Computação", course_en: "Computer Science", description_pt: "2025", description_en: "2025" }]);
    await expect(getEducation()).resolves.toEqual([{ institution: "Uni", degree: { pt: "Computação", en: "Computer Science" }, detail: { pt: "2025", en: "2025" } }]);
  });

  it("builds visual period from structured dates when legacy period absent", async () => {
    process.env.CMS_CONTENT_SOURCE = "database";
    database([{ company: "Acme", role_pt: "Dev", role_en: "Developer", responsibilities_pt: ["Entrega"], responsibilities_en: ["Ships"], start_date: "2025-01-01", end_date: null, current: true }]);
    await expect(getExperiences()).resolves.toMatchObject([{ period: { pt: "2025-01-01 - Atual", en: "2025-01-01 - Present" } }]);
  });

  it("accepts complete structured publish DTOs", () => {
    expect(experiencePublishSchema.safeParse({ company: "Acme", role: { pt: "Dev", en: "Developer" }, summary: { pt: "Resumo", en: "Summary" }, description: { pt: "Descrição", en: "Description" }, responsibilities: { pt: ["Entrega"], en: ["Ships"] }, startDate: "2025-01-01", endDate: null, current: true, location: null, employmentType: null, technologies: [], displayOrder: 0, featured: false, recruiterVisible: true, publicationStatus: "published" }).success).toBe(true);
    expect(skillPublishSchema.safeParse({ name: { pt: "React", en: "React" }, category: "frontend_mobile", displayOrder: 0, featured: false, recruiterVisible: true, publicationStatus: "published" }).success).toBe(true);
    expect(educationPublishSchema.safeParse({ institution: "Uni", course: { pt: "Curso", en: "Course" }, description: { pt: "Descrição", en: "Description" }, startDate: "2025-01-01", endDate: null, current: true, displayOrder: 0, publicationStatus: "published" }).success).toBe(true);
  });

  it("rejects invalid database content", async () => {
    process.env.CMS_CONTENT_SOURCE = "database";
    database([{ category: "backend", items: 1 }]);
    await expect(getSkills()).rejects.toThrow();
  });

  it("validates CMS flow inputs with dedicated schemas", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(reorderInputSchema.safeParse({ id, displayOrder: 2 }).success).toBe(true);
    expect(reorderInputSchema.safeParse({ id, displayOrder: -1 }).success).toBe(false);
    expect(archiveInputSchema.safeParse({ id }).success).toBe(true);
    expect(restoreInputSchema.safeParse({ id }).success).toBe(true);
    expect(archiveInputSchema.safeParse({}).success).toBe(false);
  });
});
