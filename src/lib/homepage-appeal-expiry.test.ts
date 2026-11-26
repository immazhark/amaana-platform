import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ appealFindMany: vi.fn(), cacheEntries: new Map<string, Promise<unknown>>() }));

// Model an unexpired Next data cache. The live list must not use this stale
// snapshot for statuses, visibility or payable balances on the next request.
vi.mock("next/cache", () => ({
  unstable_cache: (read: (...args: number[]) => Promise<unknown>) => (...args: number[]) => {
    const key = JSON.stringify(args);
    const existing = mocks.cacheEntries.get(key);
    if (existing) return existing;
    const pending = read(...args);
    mocks.cacheEntries.set(key, pending);
    return pending;
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { findMany: mocks.appealFindMany, fields: { goalAmount: { _ref: "appeal.goalAmount" } } } },
}));

import { getHomepageAppeals } from "./public-content";

const payable = {
  slug: "approved-appeal",
  title: "A reviewed public appeal",
  summary: "Verified need",
  category: "MEDICAL",
  beneficiaryLocation: null,
  coverImageUrl: null,
  status: "PUBLISHED",
  amountRaised: 0,
  goalAmount: 1000,
  closesAt: null,
};
beforeEach(() => {
  mocks.cacheEntries.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-21T15:00:00.000Z"));
});
afterEach(() => {
  vi.useRealTimers();
  mocks.appealFindMany.mockReset();
});

it("rechecks expiry on the next read, even if the database adapter supplies the same candidate", async () => {
  mocks.appealFindMany.mockResolvedValue([
    { ...payable, closesAt: new Date("2026-10-21T15:01:00.000Z") },
    { ...payable, slug: "second-approved-appeal", closesAt: new Date("2026-10-21T17:00:00.000Z") },
  ]);
  expect((await getHomepageAppeals(1)).map(item => item.slug)).toEqual(["approved-appeal"]);
  vi.setSystemTime(new Date("2026-10-21T15:02:00.000Z"));
  expect((await getHomepageAppeals(1)).map(item => item.slug)).toEqual(["second-approved-appeal"]);
  expect(mocks.appealFindMany).toHaveBeenCalledTimes(2);
});

it.each([
  { status: "CLOSED", amountRaised: 0 },
  { status: "FUNDED", amountRaised: 1000 },
  { status: "PUBLISHED", amountRaised: 1000 },
  { status: "DRAFT", amountRaised: 0 },
])("removes a now-ineligible candidate on the next read without relying on tag invalidation: %j", async change => {
  mocks.appealFindMany.mockResolvedValueOnce([{ ...payable }])
    .mockResolvedValueOnce([{ ...payable, ...change }]);
  expect((await getHomepageAppeals()).map(item => item.slug)).toEqual(["approved-appeal"]);
  expect(await getHomepageAppeals()).toEqual([]);
  expect(mocks.appealFindMany).toHaveBeenCalledTimes(2);
});

it("discovers newly published eligible appeals on the next read", async () => {
  mocks.appealFindMany.mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ ...payable }]);
  expect(await getHomepageAppeals()).toEqual([]);
  expect((await getHomepageAppeals()).map(item => item.slug)).toEqual(["approved-appeal"]);
  expect(mocks.appealFindMany).toHaveBeenCalledTimes(2);
});
