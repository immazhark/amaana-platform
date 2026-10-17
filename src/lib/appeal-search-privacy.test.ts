import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findAppeal: vi.fn() }));

vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { findFirst: mocks.findAppeal } },
}));

import { getAppealSearchPrivacy } from "./appeal-search-privacy";

describe("public appeal search metadata privacy", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("retains standard metadata for standalone legacy public appeals", async () => {
    mocks.findAppeal.mockResolvedValue({ assistanceRequest: null });
    await expect(getAppealSearchPrivacy("standalone")).resolves.toBe("STANDARD");
  });

  it.each(["STANDARD", "CONFIDENTIAL", "HIGHLY_SENSITIVE"])(
    "returns reviewed %s confidentiality unchanged", async level => {
      mocks.findAppeal.mockResolvedValue({
        assistanceRequest: { verification: { confidentialityLevel: level } },
      });
      await expect(getAppealSearchPrivacy("verified")).resolves.toBe(level);
    },
  );

  it.each([null, undefined, "", "RESTRICTED", "UNREVIEWED"])(
    "uses non-identifying metadata when a linked privacy label is %s", async level => {
      mocks.findAppeal.mockResolvedValue({
        assistanceRequest: { verification: { confidentialityLevel: level } },
      });
      await expect(getAppealSearchPrivacy("unreviewed")).resolves.toBe("HIGHLY_SENSITIVE");
    },
  );

  it("blocks identifiable previews when the linked verification record is absent", async () => {
    mocks.findAppeal.mockResolvedValue({ assistanceRequest: { verification: null } });
    await expect(getAppealSearchPrivacy("missing-verification")).resolves.toBe("HIGHLY_SENSITIVE");
  });

  it("uses private metadata defaults for an absent or withdrawn public record", async () => {
    mocks.findAppeal.mockResolvedValue(null);
    await expect(getAppealSearchPrivacy("not-found")).resolves.toBe("HIGHLY_SENSITIVE");
  });
});
