import { describe, expect, it } from "vitest";
import { cases, profile } from "../content/data";

describe("public portfolio content", () => {
  it("keeps public links explicit and secure-ready", () => {
    expect(profile.links.bikerway).toBe("https://bikerway.com.br/");
    expect(profile.links.eventHorizon).toContain("vercel.app");
    expect(profile.links.linkedin).toContain("linkedin.com");
    expect(profile.links.github).toContain("github.com");
  });
  it("publishes all technical case studies", () => {
    expect(cases.map(item => item.slug)).toEqual(["h3", "estado", "offline", "localizacao", "chat", "ocr"]);
  });
  it("has bilingual case content", () => {
    for (const item of cases) { expect(item.title.pt).not.toEqual(item.title.en); expect(item.sections.pt.length).toBeGreaterThan(0); expect(item.sections.en.length).toBeGreaterThan(0); }
  });
  it("uses distinct confirmed stacks per case", () => {
    expect(cases.find(item => item.slug === "h3")?.stack).toContain("deck.gl");
    expect(cases.find(item => item.slug === "offline")?.stack).toContain("BullMQ");
    expect(cases.find(item => item.slug === "localizacao")?.stack).toContain("Google Maps");
  });
});
