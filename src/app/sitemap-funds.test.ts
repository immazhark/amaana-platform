import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ empty: vi.fn(), indexing: vi.fn(), activeFund: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { faithContent: { findMany: mocks.empty }, appeal: { findMany: mocks.empty }, initiative: { findMany: mocks.empty }, story: { findMany: mocks.empty }, fund: { findFirst: mocks.activeFund } } }));
vi.mock("@/lib/site-indexing", () => ({ shouldAllowIndexing: mocks.indexing }));

import sitemap from "./sitemap";

beforeEach(() => { vi.resetAllMocks(); mocks.indexing.mockReturnValue(true); mocks.empty.mockResolvedValue([]); mocks.activeFund.mockResolvedValue({ id: "synthetic-active-fund" }); });
afterEach(() => { vi.unstubAllEnvs(); });

const paths = async () => (await sitemap()).map(entry => new URL(entry.url).pathname);

it("lists /give and /funds when giving is on and an active fund exists", async () => {
  vi.stubEnv("FUND_GIVING_ENABLED", "true");
  const open = await paths();
  expect(open).toContain("/give");
  expect(open).toContain("/funds");
  expect(mocks.activeFund).toHaveBeenCalledExactlyOnceWith({ where: { status: "ACTIVE" }, select: { id: true } });
});

it("keeps /give and /funds out of the sitemap while fund giving is off, including near-miss values", async () => {
  for (const value of [undefined, "", "false", "True", "1", "yes"]) {
    if (value === undefined) vi.stubEnv("FUND_GIVING_ENABLED", ""); else vi.stubEnv("FUND_GIVING_ENABLED", value);
    const closed = await paths();
    expect(closed, String(value)).not.toContain("/give");
    expect(closed, String(value)).not.toContain("/funds");
  }
  expect(mocks.activeFund).not.toHaveBeenCalled();
});

it("does not change the existing static pages or emit private routes", async () => {
  vi.stubEnv("FUND_GIVING_ENABLED", "true");
  const all = await paths();
  expect(all).toContain("/donate");
  expect(all).toContain("/get-involved/sponsor-education");
  expect(all.filter(path => path.startsWith("/admin") || path.startsWith("/donations") || path.startsWith("/api"))).toEqual([]);
});

it("omits both fund URLs when the switch is on but no active fund exists", async () => {
  vi.stubEnv("FUND_GIVING_ENABLED", "true");
  mocks.activeFund.mockResolvedValue(null);
  const all = await paths();
  expect(all).not.toContain("/give");
  expect(all).not.toContain("/funds");
  expect(all).toContain("/donate");
  expect(mocks.activeFund).toHaveBeenCalledExactlyOnceWith({ where: { status: "ACTIVE" }, select: { id: true } });
});

it("does not query fund availability or other content when indexing is disabled", async () => {
  vi.stubEnv("FUND_GIVING_ENABLED", "true");
  mocks.indexing.mockReturnValue(false);
  expect(await sitemap()).toEqual([]);
  expect(mocks.activeFund).not.toHaveBeenCalled();
  expect(mocks.empty).not.toHaveBeenCalled();
});
