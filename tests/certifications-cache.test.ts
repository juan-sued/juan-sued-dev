import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  unstable_cache: vi.fn(),
  getPublished: vi.fn(),
  views: vi.fn(),
  error: vi.fn(),
  cacheMeta: undefined as { keyParts?: unknown[]; options?: { tags?: string[] } } | undefined,
}));

vi.mock("next/cache", () => ({ unstable_cache: mocks.unstable_cache }));
vi.mock("../lib/repositories/certifications", () => ({
  getPublishedCertifications: mocks.getPublished,
  certificationViews: mocks.views,
}));

import { PORTFOLIO_CERTIFICATIONS_TAG, getCachedPublishedCertifications, loadCertifications } from "../lib/repositories/certifications-cache";

const dto = { id: "00000000-0000-4000-8000-000000000001", title_pt: "SQL", title_en: "SQL", issuer: "Alura", category: "database", completed_at: "2026-03-15", workload_hours: 14, skills: [], featured: true, recruiter_visible: true, display_order: 0, credential_url: null, pdf_url: "https://cdn.example/a.pdf" };

afterEach(() => vi.clearAllMocks());

describe("certifications cache", () => {
  it("wraps the published read with the portfolio tag and stable key parts", async () => {
    mocks.unstable_cache.mockImplementation((fn, keyParts, options) => { mocks.cacheMeta = { keyParts, options }; return fn; });
    mocks.getPublished.mockResolvedValue([dto]);

    await expect(getCachedPublishedCertifications()).resolves.toEqual([dto]);
    expect(mocks.cacheMeta?.keyParts).toEqual(["certifications", "published"]);
    expect(mocks.cacheMeta?.options?.tags).toEqual([PORTFOLIO_CERTIFICATIONS_TAG]);
    expect(PORTFOLIO_CERTIFICATIONS_TAG).toBe("portfolio:certifications");
  });

  it("applies locale and recruiter filtering after the cached base read", async () => {
    mocks.unstable_cache.mockImplementation(fn => fn);
    mocks.getPublished.mockResolvedValue([dto]);
    mocks.views.mockReturnValue([{ id: dto.id, title: "SQL", pdfUrl: dto.pdf_url }]);

    const result = await loadCertifications("en", true);
    expect(mocks.getPublished).toHaveBeenCalledTimes(1);
    expect(mocks.views).toHaveBeenCalledWith([dto], { locale: "en", recruiter: true });
    expect(result).toHaveLength(1);
  });

  it("returns an empty list and logs a sanitized message when the RPC fails", async () => {
    mocks.unstable_cache.mockImplementation(fn => fn);
    mocks.getPublished.mockRejectedValue(new Error("connection failed"));
    mocks.error.mockReturnValue(undefined);
    vi.spyOn(console, "error").mockImplementation(mocks.error);

    await expect(loadCertifications("pt", false)).resolves.toEqual([]);
    expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining("unable to load published certifications"), "connection failed");
  });
});
