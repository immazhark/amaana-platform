import { describe, expect, it } from "vitest";
import { canPromoteAppeal, getAppealPublicPrivacyClass } from "./appeal-promotion";

describe("appeal promotion confidentiality gate", () => {
  it.each(["STANDARD", "CONFIDENTIAL"])(
    "permits linked public discovery with the reviewed %s classification", level => {
      expect(canPromoteAppeal({
        assistanceRequest: { verification: { confidentialityLevel: level } },
      })).toBe(true);
    },
  );

  it("keeps explicitly highly sensitive linked cases off public discovery", () => {
    expect(canPromoteAppeal({
      assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } },
    })).toBe(false);
  });

  it.each([null, undefined, "", "RESTRICTED", "UNREVIEWED", "standard", "STANDARD "])(
    "fails closed on an invalid or absent linked confidentiality label (%s)", level => {
      expect(canPromoteAppeal({
        assistanceRequest: { verification: { confidentialityLevel: level } },
      })).toBe(false);
    },
  );

  it("fails closed when a linked request has no completed privacy classification record", () => {
    expect(canPromoteAppeal({ assistanceRequest: { verification: null } })).toBe(false);
    expect(canPromoteAppeal({ assistanceRequest: {} })).toBe(false);
  });

  it("preserves legacy standalone appeals that have no linked assistance request", () => {
    expect(canPromoteAppeal({ assistanceRequest: null })).toBe(true);
    expect(canPromoteAppeal({})).toBe(true);
  });

  it("uses a privacy-safe public classification for metadata and discovery", () => {
    expect(getAppealPublicPrivacyClass({ assistanceRequest: null })).toBe("STANDARD");
    expect(getAppealPublicPrivacyClass({ assistanceRequest: { verification: { confidentialityLevel: "STANDARD" } } })).toBe("STANDARD");
    expect(getAppealPublicPrivacyClass({ assistanceRequest: { verification: { confidentialityLevel: "CONFIDENTIAL" } } })).toBe("CONFIDENTIAL");
    expect(getAppealPublicPrivacyClass({ assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } } })).toBe("HIGHLY_SENSITIVE");
    expect(getAppealPublicPrivacyClass({ assistanceRequest: { verification: null } })).toBe("HIGHLY_SENSITIVE");
    expect(getAppealPublicPrivacyClass({ assistanceRequest: { verification: { confidentialityLevel: "RESTRICTED" } } })).toBe("HIGHLY_SENSITIVE");
  });
});
