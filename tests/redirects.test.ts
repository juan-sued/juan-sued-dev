import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const nextConfig = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
const proxy = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");

describe("cases redirect hotfix", () => {
  it("removes the case-insensitive self-redirect rule from next.config", () => {
    expect(nextConfig).not.toMatch(/redirects\(/);
  });

  it("preserves the uppercase alias with an exact case-sensitive redirect in proxy", () => {
    expect(proxy).toMatch(/pathname\s*===\s*"\/cases\/H3"/);
    expect(proxy).toMatch(/NextResponse\.redirect/);
  });

  it("never defines a redirect whose source normalizes to its own destination", () => {
    const rules = [...nextConfig.matchAll(/source:\s*"([^"]+)",\s*destination:\s*"([^"]+)"/g)];
    for (const [, source, destination] of rules) {
      expect(source.toLowerCase()).not.toBe(destination.toLowerCase());
    }
  });
});
