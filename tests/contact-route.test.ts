import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { POST } from "../app/api/contact/route";

const resendCalls = () => (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.filter(call => String(call[0]).includes("api.resend.com"));
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
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("CONTACT_TO_EMAIL", "me@example.com");
  vi.stubEnv("CONTACT_FROM_EMAIL", "site@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/contact", () => {
  it("sends valid data by e-mail and returns generic response without submission ID", async () => {
    const { result, json } = await response({ ...validPayload, company: "  Analytical Engine  ", sourcePath: "/contact" });

    expect(result.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(json).not.toHaveProperty("id");
    expect(resendCalls()).toHaveLength(1);
    const init = resendCalls()[0][1] as { body: string; headers: Record<string, string> };
    expect(init.headers.authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({ to: ["me@example.com"], from: "site@example.com", reply_to: "ada@example.com" });
    expect(JSON.parse(init.body).text).toContain("Analytical Engine");
  });

  it("rejects invalid email and schema limits before sending", async () => {
    const invalidEmail = await response({ ...validPayload, email: "not-an-email" });
    const tooLongMessage = await response({ ...validPayload, message: "x".repeat(2001) });

    expect(invalidEmail.result.status).toBe(400);
    expect(tooLongMessage.result.status).toBe(400);
    expect(invalidEmail.json).toEqual({ error: "Unable to send message." });
    expect(resendCalls()).toHaveLength(0);
  });

  it("rejects honeypot submissions before sending", async () => {
    const { result } = await response({ ...validPayload, honeypot: "bot" });

    expect(result.status).toBe(400);
    expect(resendCalls()).toHaveLength(0);
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
    expect(resendCalls()).toHaveLength(0);
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
    expect(resendCalls()).toHaveLength(0);
  });

  it("rejects Turnstile fetch failures", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { result } = await response({ ...validPayload, turnstileToken: "token" });

    expect(result.status).toBe(400);
    expect(resendCalls()).toHaveLength(0);
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
    expect(resendCalls()).toHaveLength(5);
  });

  it("returns generic server error when e-mail delivery fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: String(url).includes("resend") ? 500 : 200 }))));

    const { result, json } = await response();

    expect(result.status).toBe(500);
    expect(json).toEqual({ error: "Unable to send message." });
    expect(error).toHaveBeenCalledWith("Contact e-mail failed", 500);
  });

  it("returns generic server error when delivery throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => String(url).includes("resend") ? Promise.reject(new Error("network down")) : Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))));

    const { result } = await response();

    expect(result.status).toBe(500);
    expect(error).toHaveBeenCalledWith("Contact intake failed", "Error");
  });

  it("fails in production when e-mail delivery is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = await response();

    expect(result.status).toBe(500);
  });
});
