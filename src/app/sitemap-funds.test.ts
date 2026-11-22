import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ empty: vi.fn(), indexing: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { faithContent: { findMany: mocks.empty }, appeal: { findMany: mocks.empty }, initiative: { findMany: mocks.empty }, story: { findMany: mocks.empty } } }));
vi.mock("@/lib/site-indexing", () => ({ shouldAllowIndexing: mocks.indexing }));

import sitemap from "./sitemap";

beforeEach(() => { vi.resetAllMocks(); mocks.indexing.mockReturnValue(true); mocks.empty.mockResolvedValue([]); });
afterEach(() => { vi.unstubAllEnvs(); });

const paths = async () => (await sitemap()).map(entry => new URL(entry.url).pathname);

it("lists /give and /funds only while fund giving is switched on", async () => {
  vi.stubEnv("FUND_GIVING_ENABLED", "true");
  const open = await paths();
  expect(open).toContain("/give");
  expect(open).toContain("/funds");
});

it("keeps /give and /funds out of the sitemap while fund giving is off, including near-miss values", async () => {
  for (const value of [undefined, "", "false", "True", "1", "yes"]) {
    if (value === undefined) vi.stubEnv("FUND_GIVING_ENABLED", ""); else vi.stubEnv("FUND_GIVING_ENABLED", value);
    const closed = await paths();
    expect(closed, String(value)).not.toContain("/give");
    expect(closed, String(value)).not.toContain("/funds");
  }
});

it("does not change the existing static pages or emit private routes", async () => {
  vi.stubEnv("FUND_GIVING_ENABLED", "true");
  const all = await paths();
  expect(all).toContain("/donate");
  expect(all).toContain("/get-involved/sponsor-education");
  expect(all.filter(path => path.startsWith("/admin") || path.startsWith("/donations") || path.startsWith("/api"))).toEqual([]);
});
