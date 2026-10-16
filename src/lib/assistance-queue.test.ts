import { describe, expect, it } from "vitest";
import { assistanceQueueAge, assistanceQueueAgeWhere, assistanceQueueAssignmentWhere, assistanceQueueHref, parseAssistanceQueueFilters } from "./assistance-queue";

describe("private assistance queue triage", () => {
  it("accepts only known status, assignment and order values", () => {
    expect(parseAssistanceQueueFilters({ status: "SUBMITTED", assignment: "mine", order: "oldest", age: "7d" }))
      .toEqual({ status: "SUBMITTED", assignment: "mine", order: "oldest", age: "7d" });
    expect(parseAssistanceQueueFilters({ status: "invented", assignment: "staff-private-id", order: "urgent", age: "365d" }))
      .toEqual({ assignment: "all", order: "newest", age: "all" });
  });
  it("ignores repeated query values rather than trusting an arbitrary first value", () => {
    expect(parseAssistanceQueueFilters({ status: ["CLOSED"], assignment: ["mine"], order: ["oldest"], age: ["30d"] }))
      .toEqual({ assignment: "all", order: "newest", age: "all" });
  });
  it("resolves mine exclusively against the authenticated staff identity", () => {
    expect(assistanceQueueAssignmentWhere("mine", "signed-in-staff")).toEqual({ assignedToId: "signed-in-staff" });
    expect(assistanceQueueAssignmentWhere("unassigned", "signed-in-staff")).toEqual({ assignedToId: null });
    expect(assistanceQueueAssignmentWhere("all", "signed-in-staff")).toEqual({});
  });
  it("retains combined filters through pagination without exposing a staff ID", () => {
    expect(assistanceQueueHref({ status: "UNDER_VERIFICATION", assignment: "mine", order: "oldest", age: "30d" }, 3))
      .toEqual({ pathname: "/admin", query: { status: "UNDER_VERIFICATION", assignment: "mine", order: "oldest", age: "30d", page: 3 } });
    expect(assistanceQueueHref({ assignment: "all", order: "newest", age: "all" })).toEqual({ pathname: "/admin", query: {} });
  });
  const now = new Date("2026-10-15T12:00:00Z");
  it("builds exact elapsed-age predicates without a new SLA or case priority", () => {
    expect(assistanceQueueAgeWhere("all", now)).toEqual({});
    expect(assistanceQueueAgeWhere("7d", now)).toEqual({
      createdAt: { lte: new Date("2026-10-08T12:00:00Z") },
    });
    expect(assistanceQueueAgeWhere("30d", now)).toEqual({
      createdAt: { lte: new Date("2026-09-15T12:00:00Z") },
    });
  });
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
