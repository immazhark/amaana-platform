import { describe, expect, it } from "vitest";
import { ASSISTANCE_DECLINE_REASONS, ASSISTANCE_SCOPE_NOTICE, composeDeclineReason, isAssistanceIntakePaused } from "./assistance-policy";
import { classifyAssistanceResponse } from "./assistance-feedback";

describe("assistance policy", () => {
  it("pauses only on an explicit true", () => {
    expect(isAssistanceIntakePaused({ ASSISTANCE_INTAKE_PAUSED: "true" })).toBe(true);
    expect(isAssistanceIntakePaused({ ASSISTANCE_INTAKE_PAUSED: " TRUE " })).toBe(true);
    expect(isAssistanceIntakePaused({ ASSISTANCE_INTAKE_PAUSED: "false" })).toBe(false);
    expect(isAssistanceIntakePaused({})).toBe(false);
  });

  it("composes a decline reason that always works without approval fields", () => {
    expect(composeDeclineReason("DUPLICATE", "")).toBe("Duplicate request");
    expect(composeDeclineReason("OUTSIDE_SERVICE_AREA", "Lives in Pune")).toBe("Outside service area: Lives in Pune");
    expect(composeDeclineReason("OTHER", "")).toBe("");
    expect(composeDeclineReason("OTHER", "Explained to applicant")).toBe("Other: Explained to applicant");
    expect(composeDeclineReason("", "  free text ")).toBe("free text");
    expect(ASSISTANCE_DECLINE_REASONS.map(reason => reason.code)).toHaveLength(8);
  });

  it("states the limits without promising support or response times", () => {
    const text = ASSISTANCE_SCOPE_NOTICE.join(" ");
    expect(text).toMatch(/does not guarantee/);
    expect(text).toMatch(/phone calls or WhatsApp/);
    expect(text).not.toMatch(/within \d+ (hours|days)/i);
  });

  it("lets the form tell a service-area stop from other rejections", () => {
    const result = classifyAssistanceResponse(422, { error: "Not in area", code: "outside_service_area" });
    expect(result).toMatchObject({ kind: "rejected", code: "outside_service_area" });
    expect(classifyAssistanceResponse(403, { error: "Paused", code: "intake_paused" })).toMatchObject({ kind: "rejected", code: "intake_paused" });
  });
});
