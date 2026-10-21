import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ appealFindMany: vi.fn() }));

// Model Next's 300-second data cache: the same SQL projection is reused during
// the TTL even when time-sensitive public eligibility changes.
vi.mock("next/cache", () => ({
  unstable_cache: (read: (...args: number[]) => Promise<unknown>) => {
    const entries = new Map<string, Promise<unknown>>();
    return (...args: number[]) => {
      const key = JSON.stringify(args);
      const existing = entries.get(key);
      if (existing) return existing;
      const pending = read(...args);
      entries.set(key, pending);
      return pending;
    };
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { findMany: mocks.appealFindMany } },
}));

import { getHomepageAppeals } from "./public-content";

afterEach(() => {
  vi.useRealTimers();
  mocks.appealFindMany.mockReset();
});

it("rechecks expired appeals on a fresh render while database results remain cached", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-21T15:00:00.000Z"));
  const expiringAppeal = {
    slug: "approved-appeal",
    title: "A reviewed public appeal",
    summary: "Verified need",
    category: "MEDICAL",
    beneficiaryLocation: null,
    coverImageUrl: null,
    status: "PUBLISHED",
    amountRaised: 0,
    goalAmount: 1000,
    closesAt: new Date("2026-10-21T15:01:00.000Z"),
  };
  mocks.appealFindMany.mockResolvedValue([
    expiringAppeal,
    {
      ...expiringAppeal,
      slug: "second-approved-appeal",
      title: "Another reviewed need",
      closesAt: new Date("2026-10-21T17:00:00.000Z"),
    },
  ]);

  expect((await getHomepageAppeals(1)).map(item => item.slug)).toEqual(["approved-appeal"]);
  // The 300-second cache must still hold the same database result at this point.
  vi.setSystemTime(new Date("2026-10-21T15:02:00.000Z"));
  expect((await getHomepageAppeals(1)).map(item => item.slug)).toEqual(["second-approved-appeal"]);
  expect(mocks.appealFindMany).toHaveBeenCalledTimes(1);
});
