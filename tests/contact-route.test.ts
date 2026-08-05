import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mocks.from }),
}));

import { POST } from "../app/api/contact/route";

const validPayload = { name: "Ada Lovelace", email: "ada@example.com", message: "I would like to discuss a project.", turnstileToken: "test-token" };
const request = (body: unknown = validPayload, forwardedFor = crypto.randomUUID()) => new Request("http://localhost/api/contact", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": forwardedFor, referer: "https://example.com/contact" }, body: JSON.stringify(body) }) as NextRequest;
const response = async (body?: unknown, forwardedFor?: string) => {
  const result = await POST(request(body, forwardedFor));
  return { result, json: await result.json() };
};

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 })));
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  mocks.from.mockReset();
  mocks.insert.mockReset();
});

describe("POST /api/contact", () => {
  it("persists valid data and returns generic response without submission ID", async () => {
    const { result, json } = await response({ ...validPayload, company: "  Analytical Engine  ", sourcePath: "/contact" });

    expect(result.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(json).not.toHaveProperty("id");
    expect(mocks.from).toHaveBeenCalledWith("contact_submissions");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ name: "Ada Lovelace", company: "Analytical Engine", source_path: "/contact", referrer: "https://example.com/contact" }));
  });

  it("rejects invalid email and schema limits before persistence", async () => {
    const invalidEmail = await response({ ...validPayload, email: "not-an-email" });
    const tooLongMessage = await response({ ...validPayload, message: "x".repeat(2001) });

    expect(invalidEmail.result.status).toBe(400);
    expect(tooLongMessage.result.status).toBe(400);
    expect(invalidEmail.json).toEqual({ error: "Unable to send message." });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects honeypot submissions before persistence", async () => {
    const { result } = await response({ ...validPayload, honeypot: "bot" });

    expect(result.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("accepts valid configured Turnstile token", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = await response({ ...validPayload, turnstileToken: "valid-token" });

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith("https://challenges.cloudflare.com/turnstile/v0/siteverify", expect.objectContaining({ method: "POST" }));
  });

  it("rejects invalid or missing configured Turnstile token", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 })));

    const invalid = await response({ ...validPayload, turnstileToken: "invalid-token" });
    const missing = await response(validPayload);

    expect(invalid.result.status).toBe(400);
    expect(missing.result.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects partial Turnstile config and production missing config", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const partial = await response(validPayload);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const production = await response(validPayload);

    expect(partial.result.status).toBe(400);
    expect(production.result.status).toBe(400);
    expect(error).toHaveBeenCalledWith("Contact protection is not configured");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects Turnstile fetch failures", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { result } = await response({ ...validPayload, turnstileToken: "token" });

    expect(result.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rate limits long forwarded headers using bounded visitor key", async () => {
    const longHeader = `198.51.100.9, ${"x".repeat(1000)}`;
    const boundedHeader = longHeader.slice(0, 256);
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))));

    const statuses: number[] = [];
    for (let count = 0; count < 5; count += 1) statuses.push((await response(validPayload, longHeader)).result.status);
    const limited = await response(validPayload, boundedHeader);

    expect(statuses).toEqual([200, 200, 200, 200, 200]);
    expect(limited.result.status).toBe(429);
    expect(limited.json).toEqual({ error: "Unable to send message." });
    expect(mocks.insert).toHaveBeenCalledTimes(5);
  });

  it("returns generic server error when insert reports error", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505" } });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result, json } = await response();

    expect(result.status).toBe(500);
    expect(json).toEqual({ error: "Unable to send message." });
    expect(error).toHaveBeenCalledWith("Contact insert failed", "23505");
  });

  it("returns generic server error when insert throws", async () => {
    mocks.insert.mockRejectedValue(new Error("database unavailable"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result, json } = await response();

    expect(result.status).toBe(500);
    expect(json).toEqual({ error: "Unable to send message." });
    expect(error).toHaveBeenCalledWith("Contact intake failed", "Error");
  });
});
