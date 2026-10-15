import { describe, expect, it } from "vitest";
import { assistanceQueueAge, assistanceQueueAssignmentWhere, assistanceQueueHref, parseAssistanceQueueFilters } from "./assistance-queue";

describe("private assistance queue triage", () => {
  it("accepts only known status, assignment and order values", () => {
    expect(parseAssistanceQueueFilters({ status: "SUBMITTED", assignment: "mine", order: "oldest" }))
      .toEqual({ status: "SUBMITTED", assignment: "mine", order: "oldest" });
    expect(parseAssistanceQueueFilters({ status: "invented", assignment: "staff-private-id", order: "urgent" }))
      .toEqual({ assignment: "all", order: "newest" });
  });
  it("ignores repeated query values rather than trusting an arbitrary first value", () => {
    expect(parseAssistanceQueueFilters({ status: ["CLOSED"], assignment: ["mine"], order: ["oldest"] }))
      .toEqual({ assignment: "all", order: "newest" });
  });
  it("resolves mine exclusively against the authenticated staff identity", () => {
    expect(assistanceQueueAssignmentWhere("mine", "signed-in-staff")).toEqual({ assignedToId: "signed-in-staff" });
    expect(assistanceQueueAssignmentWhere("unassigned", "signed-in-staff")).toEqual({ assignedToId: null });
    expect(assistanceQueueAssignmentWhere("all", "signed-in-staff")).toEqual({});
  });
  it("retains combined filters through pagination without exposing a staff ID", () => {
    expect(assistanceQueueHref({ status: "UNDER_VERIFICATION", assignment: "mine", order: "oldest" }, 3))
      .toEqual({ pathname: "/admin", query: { status: "UNDER_VERIFICATION", assignment: "mine", order: "oldest", page: 3 } });
    expect(assistanceQueueHref({ assignment: "all", order: "newest" })).toEqual({ pathname: "/admin", query: {} });
  });
  const now = new Date("2026-10-15T12:00:00Z");
  it.each([
    ["2026-10-15T12:00:00Z", "Under 1 day"],
    ["2026-10-14T12:00:01Z", "Under 1 day"],
    ["2026-10-14T12:00:00Z", "1 day"],
    ["2026-10-01T12:00:00Z", "14 days"],
    ["2026-10-15T12:00:01Z", "Date needs review"],
    ["invalid", "Date needs review"],
  ])("displays elapsed request age for %s", (created, label) => {
    expect(assistanceQueueAge(new Date(created), now)).toBe(label);
  });
});
