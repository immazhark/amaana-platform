import { describe, expect, it } from "vitest";
import { mrKhajaPublicInformation } from "./mr-khaja-public-information";

describe("public medical-support information: Mr. Khaja", () => {
  it("uses only the family's approved short name and a separate informational URL", () => {
    expect(mrKhajaPublicInformation.displayName).toBe("Mr. Khaja");
    expect(mrKhajaPublicInformation.path).toBe("/medical-support/mr-khaja");
    expect(mrKhajaPublicInformation.title).toContain("Mr. Khaja");
    expect(mrKhajaPublicInformation.title).not.toMatch(/Ansari/i);
  });

  it("distinguishes family-requested amount from a financially approved site appeal", () => {
    expect(mrKhajaPublicInformation.requestedINR).toBe(500_000);
    expect(mrKhajaPublicInformation.fundraisingStatus).toBe("INFORMATION_ONLY");
    expect(mrKhajaPublicInformation.donationCheckoutPath).toBeNull();
    expect(mrKhajaPublicInformation.zakatEligibility).toBe("UNVERIFIED");
  });

  it("shows the owner's approved ₹5,00,000 fundraising target without asserting case checkout is live", () => {
    expect(mrKhajaPublicInformation.requestedINR).toBe(500_000);
    expect(mrKhajaPublicInformation.evidenceNotice).toMatch(/approved fundraising target/i);
    expect(mrKhajaPublicInformation.evidenceNotice).toMatch(/not an independently certified medical estimate/i);
    expect(mrKhajaPublicInformation.evidenceNotice).not.toMatch(/not an approved(?:, remaining)? fundraising target/i);
    expect(mrKhajaPublicInformation.fundraisingStatus).toBe("INFORMATION_ONLY");
    expect(mrKhajaPublicInformation.donationCheckoutPath).toBeNull();
  });

  it("keeps confidential medical proofs, foreign payment instructions and private identifiers out of public copy", () => {
    const copy = [mrKhajaPublicInformation.title,
      mrKhajaPublicInformation.summary,
      ...mrKhajaPublicInformation.story,
      mrKhajaPublicInformation.paymentNotice].join(" ");
    expect(copy).not.toMatch(/mythri|zelle|quick\s?pay|hospital bill|discharge summary|80g|FCRA registered/i);
    expect(copy).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(copy).not.toMatch(/\b(?:\+?91[- ]?)?[6-9]\d{9}\b/);
    expect(copy).not.toContain("925020008040264");
    expect(copy).not.toContain("UTIB0002922");
    expect(copy).toMatch(/India/);
  });

  it("attributes medical and financial circumstances to the family, rather than certifying them", () => {
    expect(mrKhajaPublicInformation.summary).toMatch(/family reports|according to the family|family has requested/i);
    expect(mrKhajaPublicInformation.paymentNotice).toMatch(/not yet available|not yet active/i);
  });
});
