import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getCases } from "../lib/repositories/cases";
import { getEducation } from "../lib/repositories/education";
import { getExperiences } from "../lib/repositories/experiences";
import { getProfile } from "../lib/repositories/profile";
import { getResumeUrls } from "../lib/repositories/resumes";
import { getSkills } from "../lib/repositories/skills";
import { getPublishedCertifications } from "../lib/repositories/certifications";

const publicFile = (url: string) => join(process.cwd(), "public", url);

describe("local portfolio content", () => {
  it("publishes all technical case studies in order", async () => {
    const cases = await getCases();
    expect(cases.map(item => item.slug)).toEqual(["h3", "estado", "offline", "localizacao", "chat", "ocr"]);
  });

  it("has bilingual case content", async () => {
    for (const item of await getCases()) {
      expect(item.title.pt).not.toEqual(item.title.en);
      expect(item.sections.pt.length).toBeGreaterThan(0);
      expect(item.sections.en.length).toBeGreaterThan(0);
    }
  });

  it("keeps public links explicit and secure-ready", async () => {
    const profile = await getProfile();
    expect(profile.links.bikerway).toBe("https://bikerway.com.br/");
    expect(profile.links.eventHorizon).toContain("vercel.app");
    expect(profile.links.linkedin).toContain("linkedin.com");
    expect(profile.links.github).toContain("github.com");
  });

  it("loads experiences, skills and education", async () => {
    expect(await getExperiences()).toHaveLength(4);
    expect(await getSkills()).toHaveLength(5);
    expect(await getEducation()).toHaveLength(2);
  });

  it("points every certification and resume at a file that exists in public/", async () => {
    const certifications = await getPublishedCertifications();
    expect(certifications).toHaveLength(11);
    for (const item of certifications) expect(existsSync(publicFile(item.pdf_url)), item.pdf_url).toBe(true);
    const resumes = await getResumeUrls();
    for (const url of Object.values(resumes)) expect(url && existsSync(publicFile(url)), String(url)).toBeTruthy();
  });
});

describe("github projects", () => {
  it("falls back to curated entries when the GitHub API is unavailable", async () => {
    const { vi } = await import("vitest");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { getGitHubSummary } = await import("../lib/repositories/github");
    const summary = await getGitHubSummary();
    expect(summary.repos.length).toBeGreaterThan(0);
    expect(summary.repos[0]).toMatchObject({ language: null, pushedAt: null, stars: 0 });
    expect(summary.repos[0].url).toContain("github.com/juan-sued/");
    vi.unstubAllGlobals();
    error.mockRestore();
  });
});

describe("projects", () => {
  it("lists the product case studies with existing images and valid links", async () => {
    const { getProjects } = await import("../lib/repositories/projects");
    const projects = await getProjects();
    expect(projects.map(item => item.slug)).toEqual(["bikerway", "conta-e-canta", "8pixie", "promogrupo", "event-horizon"]);
    for (const project of projects) {
      expect(project.links.length, project.slug).toBeGreaterThan(0);
      for (const link of project.links) expect(link.url.startsWith("https://"), link.url).toBe(true);
      if (project.cover) expect(existsSync(publicFile(project.cover.src)), project.cover.src).toBe(true);
      for (const shot of [...project.gallery, ...project.panel]) expect(existsSync(publicFile(shot.src)), shot.src).toBe(true);
    }
  });
});
