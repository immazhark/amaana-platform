import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appealFindMany: vi.fn(),
  initiativeFindFirst: vi.fn(),
  cachedAppeals: undefined as unknown,
  hasCachedAppeals: false,
}));

// Model the five-minute Next cache: subsequent reads reuse the original
// bounded candidate projection while the independent clock moves forward.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => async () => {
    if (!mocks.hasCachedAppeals) {
      mocks.cachedAppeals = await fn();
      mocks.hasCachedAppeals = true;
    }
    return mocks.cachedAppeals;
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findMany: mocks.appealFindMany },
    initiative: { findFirst: mocks.initiativeFindFirst },
  },
}));
vi.mock("@/lib/faith-publication", () => ({ publicFaithWhere: { status: "PUBLISHED" } }));

import { getHomepageAppeals, getPublishedInitiativeBySlug } from "./public-content";

const base = {
  slug: "public-verified-appeal",
  title: "Approved public appeal",
  summary: "Reviewed summary",
  category: "MEDICAL",
  beneficiaryLocation: null,
  coverImageUrl: null,
  status: "PUBLISHED",
  goalAmount: 75_000,
  amountRaised: 10_000,
  closesAt: null,
};

describe("public promotional appeal projections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasCachedAppeals = false;
    mocks.cachedAppeals = undefined;
  });
  afterEach(() => vi.useRealTimers());

  it("does not promote a HIGHLY_SENSITIVE case on home or live-rail query", async () => {
    const sensitive = {
      ...base,
      slug: "restricted-appeal",
      title: "Sensitive identity",
      summary: "Private case narrative",
      assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } },
    };
    const standard = {
      ...base,
      assistanceRequest: { verification: { confidentialityLevel: "STANDARD" } },
    };
    mocks.appealFindMany.mockResolvedValue([sensitive, standard]);
    const appeals = await getHomepageAppeals(20);

    expect(appeals).toHaveLength(1);
    expect(appeals[0]?.slug).toBe(base.slug);
    expect(appeals[0]).not.toHaveProperty("assistanceRequest");
    expect(JSON.stringify(appeals)).not.toContain("Sensitive identity");
    expect(JSON.stringify(appeals)).not.toContain("confidentialityLevel");
    expect(mocks.appealFindMany).toHaveBeenCalledTimes(1);
    expect(mocks.appealFindMany.mock.calls[0]?.[0]?.select?.assistanceRequest).toBeDefined();
  });

  it("promotes the next eligible cached appeal after a featured campaign closes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
    const privateCheck = { verification: { confidentialityLevel: "STANDARD" } };
    const expiring = { ...base, slug: "expiring", closesAt: new Date("2026-10-15T12:01:00.000Z"), assistanceRequest: privateCheck };
    const continuing = { ...base, slug: "continuing", closesAt: new Date("2026-10-15T13:00:00.000Z"), assistanceRequest: privateCheck };
    mocks.appealFindMany.mockResolvedValue([expiring, continuing]);

    expect((await getHomepageAppeals(1)).map(appeal => appeal.slug)).toEqual(["expiring"]);
    vi.setSystemTime(new Date("2026-10-15T12:02:00.000Z"));
    expect((await getHomepageAppeals(1)).map(appeal => appeal.slug)).toEqual(["continuing"]);
    expect(mocks.appealFindMany).toHaveBeenCalledTimes(1);
  });

  it("still applies each caller's limit after the time-based and privacy gates", async () => {
    const standard = { verification: { confidentialityLevel: "STANDARD" } };
    mocks.appealFindMany.mockResolvedValue([
      { ...base, slug: "private", assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } } },
      ...Array.from({ length: 22 }, (_, index) => ({ ...base, slug: `safe-${index + 1}`, assistanceRequest: standard })),
    ]);
    expect((await getHomepageAppeals(3)).map(appeal => appeal.slug)).toEqual(["safe-1", "safe-2", "safe-3"]);
    expect(await getHomepageAppeals(100)).toHaveLength(20);
    expect(mocks.appealFindMany).toHaveBeenCalledTimes(1);
  });

  it("excludes a HIGHLY_SENSITIVE cross-link from an initiative without serializing private verification", async () => {
    mocks.initiativeFindFirst.mockResolvedValue({
      slug: "medical-relief-2026",
      title: "Public initiative",
      appeals: [
        { ...base, id: "a", title: "Sensitive identity", assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } } },
        { ...base, id: "b", assistanceRequest: { verification: { confidentialityLevel: "STANDARD" } } },
      ],
    });
    const initiative = await getPublishedInitiativeBySlug("medical-relief-2026");
    expect(initiative?.appeals).toHaveLength(1);
    expect(initiative?.appeals[0]?.id).toBe("b");
    expect(initiative?.appeals[0]).not.toHaveProperty("assistanceRequest");
    expect(JSON.stringify(initiative)).not.toContain("Sensitive identity");
    expect(JSON.stringify(initiative)).not.toContain("confidentialityLevel");
  });
});
