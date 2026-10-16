import { describe, expect, it } from "vitest";
import {
  PRIVATE_MILESTONE_ACTION, canAddPrivateMilestone,
  parsePrivateMilestoneInput, readPrivateMilestone,
} from "./assistance-private-milestone";

const submissionId = "56d6e16d-781f-464f-bc4c-2178d93cdd01";
function entry(patch: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    id: "case-synthetic", kind: "DOCUMENT_FOLLOW_UP",
    summary: "A supporting document is being reviewed by the team.",
    submissionId, expectedUpdatedAt: "2026-10-16T08:00:00.000Z", ...patch,
  })) form.set(key, value);
  return form;
}

describe("private assistance follow-up boundary", () => {
  it("accepts only a bounded internal note and valid version/idempotency token", () => {
    expect(parsePrivateMilestoneInput(entry())).toEqual({
      id: "case-synthetic", kind: "DOCUMENT_FOLLOW_UP",
      summary: "A supporting document is being reviewed by the team.",
      submissionId, expectedUpdatedAt: new Date("2026-10-16T08:00:00.000Z"),
    });
  });
  it.each([
    { kind: "APPROVED_PUBLIC" },
    { summary: "short" },
    { summary: "x".repeat(601) },
    { summary: "Unsafe\u0000entry content" },
    { submissionId: "not-a-uuid" },
    { expectedUpdatedAt: "invalid" },
    { expectedUpdatedAt: "2026-02-30T08:00:00.000Z" },
    { id: "" },
  ])("rejects malformed follow-up fields (%j)", patch => {
    expect(() => parsePrivateMilestoneInput(entry(patch))).toThrow();
  });
  it("rejects form file uploads instead of silently coercing values", () => {
    const data = entry();
    data.set("summary", new File(["private"], "medical.pdf"));
    expect(() => parsePrivateMilestoneInput(data)).toThrow();
  });
  it("filters malformed legacy audit metadata rather than rendering arbitrary JSON", () => {
    expect(readPrivateMilestone({ kind: "REVIEW_HANDOFF", summary: "Handed off for a second review." }))
      .toEqual({ kind: "REVIEW_HANDOFF", summary: "Handed off for a second review." });
    expect(readPrivateMilestone({ kind: "APPROVED_PUBLIC", summary: "Unreviewed disclosure" })).toBeNull();
    expect(readPrivateMilestone({ kind: "REVIEW_HANDOFF", summary: "x".repeat(601) })).toBeNull();
    expect(readPrivateMilestone(null)).toBeNull();
    expect(PRIVATE_MILESTONE_ACTION).toBe("assistance.private_milestone_added");
  });
  it("locks terminal and converted cases, but permits authorized work on active cases", () => {
    for (const status of ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED"]) {
      expect(canAddPrivateMilestone(status, null)).toBe(true);
      expect(canAddPrivateMilestone(status, "appeal-id")).toBe(false);
    }
    for (const status of ["REJECTED", "CLOSED", "CONVERTED_TO_APPEAL", "UNRECOGNIZED"]) {
      expect(canAddPrivateMilestone(status, null)).toBe(false);
    }
  });
});
