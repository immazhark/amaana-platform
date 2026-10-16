import { describe, expect, it } from "vitest";
import { AssistanceFollowUpState } from "@prisma/client";
import {
  eligibleFollowUpStaffWhere, followUpDueLabel, indiaCalendarDay, parseCalendarDay,
  parseFollowUpAssignment, parseFollowUpCreation, parseFollowUpReschedule, parseFollowUpResolution, shiftedCalendarDay,
} from "./assistance-follow-up";

const now = new Date("2026-10-16T20:15:00Z");
const day = "2026-10-17";
const version = "2026-10-16T08:00:00.000Z";
const token = "e6d9ae63-a62b-4bca-b77b-e9574482db6a";
const form = (fields: Record<string, string>) => {
  const result = new FormData();
  for (const [key, value] of Object.entries(fields)) result.set(key, value);
  return result;
};
const create = (override: Record<string, string> = {}) => form({
  id: "case-synthetic", submissionId: token, assignedToId: "reviewer-synthetic",
  summary: "Contact the family to confirm document availability.",
  dueOn: day, expectedUpdatedAt: version, ...override,
});

describe("private date-only assistance follow-up scheduling", () => {
  it("uses the Hyderabad calendar day around UTC midnight", () => {
    expect(indiaCalendarDay(now)).toBe(day);
    expect(shiftedCalendarDay(day, 365)).toBe("2027-10-17");
  });
  it("normalizes a bounded valid staff-authored task", () => {
    expect(parseFollowUpCreation(create(), day)).toEqual({
      id: "case-synthetic", submissionId: token, assignedToId: "reviewer-synthetic",
      summary: "Contact the family to confirm document availability.",
      dueOn: new Date("2026-10-17T00:00:00.000Z"),
      expectedUpdatedAt: new Date(version),
    });
  });
  it.each([
    { dueOn: "2026-10-16" }, { dueOn: "2027-10-18" },
    { dueOn: "2026-02-30" }, { dueOn: "invalid" },
    { submissionId: "reuse" }, { summary: "short" },
    { summary: "x".repeat(301) }, { summary: "Unsafe\u0000task body" },
    { id: "../cases" }, { expectedUpdatedAt: "invalid" },
  ])("rejects invalid task fields (%j)", fields => {
    expect(() => parseFollowUpCreation(create(fields), day)).toThrow();
  });
  it("accepts only a valid future reschedule with an unchanged task identity", () => {
    const data = form({ id: "case-synthetic", taskId: "task-synthetic",
      dueOn: "2026-10-23", expectedTaskUpdatedAt: version });
    expect(parseFollowUpReschedule(data, day)).toEqual({
      id: "case-synthetic", taskId: "task-synthetic",
      dueOn: new Date("2026-10-23T00:00:00Z"),
      expectedUpdatedAt: new Date(version),
    });
    data.set("dueOn", "2026-10-16");
    expect(() => parseFollowUpReschedule(data, day)).toThrow();
  });
  it("requires explicit task responsibility and parses coordinator reassignment", () => {
    const data = form({ id: "case-synthetic", taskId: "task-synthetic",
      assignedToId: "reviewer-synthetic", expectedTaskUpdatedAt: version });
    expect(parseFollowUpAssignment(data)).toEqual({
      id: "case-synthetic", taskId: "task-synthetic",
      assignedToId: "reviewer-synthetic", expectedUpdatedAt: new Date(version),
    });
    expect(() => parseFollowUpCreation(create({ assignedToId: "" }), day)).toThrow("eligible");
    data.set("assignedToId", "../untrusted");
    expect(() => parseFollowUpAssignment(data)).toThrow();
    expect(eligibleFollowUpStaffWhere("reviewer-synthetic")).toEqual(
      expect.objectContaining({ id: "reviewer-synthetic", status: "ACTIVE" }));
  });
  it("resolves only explicit terminal task states and exact versions", () => {
    expect(parseFollowUpResolution(form({
      id: "case-synthetic", taskId: "task-synthetic",
      state: "COMPLETED", expectedTaskUpdatedAt: version,
    }))).toEqual({
      id: "case-synthetic", taskId: "task-synthetic",
      state: "COMPLETED", expectedUpdatedAt: new Date(version),
    });
    expect(() => parseFollowUpResolution(form({
      id: "case-synthetic", taskId: "task-synthetic",
      state: "APPROVED_PUBLIC", expectedTaskUpdatedAt: version,
    }))).toThrow();
  });
  it("distinguishes operator-selected dates from fabricated case urgency", () => {
    expect(followUpDueLabel(AssistanceFollowUpState.OPEN, new Date("2026-10-16T00:00:00Z"), day))
      .toBe("Past selected date by 1 day");
    expect(followUpDueLabel(AssistanceFollowUpState.OPEN, new Date("2026-10-17T00:00:00Z"), day))
      .toBe("Due today");
    expect(followUpDueLabel(AssistanceFollowUpState.COMPLETED, new Date("2026-10-17T00:00:00Z"), day))
      .toBe("Completed");
  });
});
