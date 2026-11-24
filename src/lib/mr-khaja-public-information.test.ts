import { describe, expect, it } from "vitest";
import { mrKhajaPublicInformation } from "./mr-khaja-public-information";

describe("public medical-support information: Mr. Khaja", () => {
  it("uses only the family's approved short name and a separate informational URL", () => {
    expect(mrKhajaPublicInformation.displayName).toBe("Mr. Khaja");
    expect(mrKhajaPublicInformation.path).toBe("/medical-support/mr-khaja");
    expect(mrKhajaPublicInformation.title).toContain("Mr. Khaja");
    expect(mrKhajaPublicInformation.title).not.toMatch(/Ansari/i);
  });

  it("keeps the earlier target separate from live checkout and financial reconciliation", () => {
    expect(mrKhajaPublicInformation.requestedINR).toBe(500_000);
    expect(mrKhajaPublicInformation.fundraisingStatus).toBe("CLOSED");
    expect(mrKhajaPublicInformation.donationCheckoutPath).toBeNull();
    expect(mrKhajaPublicInformation.zakatEligibility).toBe("UNVERIFIED");
  });

  it("preserves the earlier approved ₹5,00,000 target as historical context without restarting checkout", () => {
    expect(mrKhajaPublicInformation.requestedINR).toBe(500_000);
    expect(mrKhajaPublicInformation.evidenceNotice).toMatch(/previously approved.*fundraising target/i);
    expect(mrKhajaPublicInformation.evidenceNotice).toMatch(/not an independently certified medical estimate/i);
    expect(mrKhajaPublicInformation.evidenceNotice).not.toMatch(/not an approved(?:, remaining)? fundraising target/i);
    expect(mrKhajaPublicInformation.fundraisingStatus).toBe("CLOSED");
    expect(mrKhajaPublicInformation.donationCheckoutPath).toBeNull();
  });

  it("honours the confirmed collection closure without soliciting further case-specific support", () => {
    expect(mrKhajaPublicInformation.fundraisingStatus).toBe("CLOSED");
    expect(mrKhajaPublicInformation.paymentNotice).toMatch(/collection for this appeal is closed/i);
    expect([...mrKhajaPublicInformation.story, mrKhajaPublicInformation.paymentNotice].join(" "))
      .not.toMatch(/sharing this request may help|confirm an approved way to contribute/i);
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
    expect(copy).not.toMatch(/pay using|make a donation|bank transfer|UPI|transfer to/i);
  });

  it("attributes medical and financial circumstances to the family, rather than certifying them", () => {
    expect(mrKhajaPublicInformation.summary).toMatch(/family reports|according to the family|family has requested/i);
    expect(mrKhajaPublicInformation.paymentNotice).toMatch(/collection for this appeal is closed/i);
  });
});
