import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn((path: string) => { throw new Error(`REDIRECT ${path}`); }));
vi.mock("next/navigation", () => ({ permanentRedirect: redirect }));

import TaleemShortLink from "./page";

const go = (params: Record<string, string | string[] | undefined>) => TaleemShortLink({ searchParams: Promise.resolve(params) });

describe("/taleem short link", () => {
  it("permanently redirects to the canonical Taleem overview", async () => {
    await expect(go({})).rejects.toThrow("REDIRECT /our-work/taleem");
    expect(redirect).toHaveBeenCalledWith("/our-work/taleem");
  });

  it("keeps campaign tags, including repeated parameters, in order", async () => {
    await expect(go({ utm_source: "instagram", utm_campaign: "taleem-2026", tag: ["a", "b"] })).rejects.toThrow("REDIRECT /our-work/taleem?utm_source=instagram&utm_campaign=taleem-2026&tag=a&tag=b");
  });

  it("drops undefined values and encodes everything it keeps", async () => {
    await expect(go({ a: undefined, "q r": "x&y=z" })).rejects.toThrow("REDIRECT /our-work/taleem?q+r=x%26y%3Dz");
  });

  it("can never be steered to another path or host by the query", async () => {
    const hostileValues = ["//evil.example", "https://evil.example", "/\evil.example", "../admin", "\u000d\u000aLocation: https://evil.example"];
    for (const hostile of hostileValues) {
      redirect.mockClear();
      await expect(go({ next: hostile, redirect: hostile })).rejects.toThrow();
      const destination = redirect.mock.calls[0]![0];
      expect(destination.startsWith("/our-work/taleem?")).toBe(true);
      expect(destination.split("?")[0]).toBe("/our-work/taleem");
      expect(destination).not.toMatch(/[\u000d\u000a]/);
    }
  });
});
