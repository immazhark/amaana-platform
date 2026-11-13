import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { findFirst: mocks.findFirst } },
}));

import { getAppealSearchPrivacy } from "./appeal-search-privacy";

beforeEach(() => {
  mocks.findFirst.mockReset();
});

describe("appeal metadata confidentiality", () => {
  it("does not treat an assistance-linked appeal without verification as standard", async () => {
    mocks.findFirst.mockResolvedValue({ assistanceRequest: { verification: null } });
    await expect(getAppealSearchPrivacy("synthetic-linked-unverified")).resolves.toBe("UNVERIFIED");
  });

  it("preserves the reviewed highly sensitive classification", async () => {
    mocks.findFirst.mockResolvedValue({
      assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } },
    });
    await expect(getAppealSearchPrivacy("synthetic-linked-sensitive")).resolves.toBe("HIGHLY_SENSITIVE");
  });

  it("keeps a public appeal without an assistance request at the standard baseline", async () => {
    mocks.findFirst.mockResolvedValue({ assistanceRequest: null });
    await expect(getAppealSearchPrivacy("synthetic-unlinked")).resolves.toBe("STANDARD");
  });
});
