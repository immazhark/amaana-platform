import { describe, expect, it } from "vitest";
import { canPromoteAppeal } from "./appeal-promotion";

describe("appeal promotion confidentiality gate", () => {
  it("keeps explicitly highly sensitive cases off public discovery surfaces", () => {
    expect(canPromoteAppeal({
      assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } },
    })).toBe(false);
  });

  it.each(["STANDARD", "RESTRICTED", null])(
    "does not change existing public discovery behavior for %s classification", level => {
      expect(canPromoteAppeal({
        assistanceRequest: { verification: { confidentialityLevel: level } },
      })).toBe(true);
    },
  );

  it("retains legacy reviewed records without linked assistance verification", () => {
    expect(canPromoteAppeal({ assistanceRequest: null })).toBe(true);
    expect(canPromoteAppeal({ assistanceRequest: { verification: null } })).toBe(true);
    expect(canPromoteAppeal({})).toBe(true);
  });
});
