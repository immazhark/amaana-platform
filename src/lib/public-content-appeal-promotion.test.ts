import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appealFindMany: vi.fn(),
  initiativeFindFirst: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
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
  beforeEach(() => vi.clearAllMocks());

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
