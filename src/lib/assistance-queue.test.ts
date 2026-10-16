import { describe, expect, it } from "vitest";
import { assistanceQueueAge, assistanceQueueAgeWhere, assistanceQueueAssignmentWhere, assistanceQueueDeliveryWhere, assistanceQueueFollowUpWhere, assistanceQueueHref, assistanceQueueReviewWhere, assistanceQueueVerificationLabel, parseAssistanceQueueFilters } from "./assistance-queue";

describe("private assistance queue triage", () => {
  it("accepts only known status, assignment and order values", () => {
    expect(parseAssistanceQueueFilters({ status: "SUBMITTED", assignment: "mine", order: "oldest", age: "7d", review: "incomplete", followUp: "due", delivery: "all" }))
      .toEqual({ status: "SUBMITTED", assignment: "mine", order: "oldest", age: "7d", review: "incomplete", followUp: "due", delivery: "all" });
    expect(parseAssistanceQueueFilters({ status: "invented", assignment: "staff-private-id", order: "urgent", age: "365d", review: "approved" }))
      .toEqual({ assignment: "all", order: "newest", age: "all", review: "all", followUp: "all", delivery: "all" });
  });
  it("ignores repeated query values rather than trusting an arbitrary first value", () => {
    expect(parseAssistanceQueueFilters({ status: ["CLOSED"], assignment: ["mine"], order: ["oldest"], age: ["30d"], review: ["complete"] }))
      .toEqual({ assignment: "all", order: "newest", age: "all", review: "all", followUp: "all", delivery: "all" });
  });
  it("accepts bounded self-reported cities and excludes unsafe query strings", () => {
    expect(parseAssistanceQueueFilters({ city: " Hyderabad " }).city).toBe("Hyderabad");
    expect(parseAssistanceQueueFilters({ city: "Hyderabad\\ninvalid".replace("\\n", "\n") }).city).toBeUndefined();
    expect(parseAssistanceQueueFilters({ city: "x".repeat(81) }).city).toBeUndefined();
    expect(parseAssistanceQueueFilters({ city: ["Hyderabad", "Mumbai"] }).city).toBeUndefined();
    expect(assistanceQueueHref({ assignment: "mine", order: "newest", age: "7d", city: "Hyderabad", review: "complete", followUp: "open", delivery: "all" }))
      .toEqual({ pathname: "/admin", query: { assignment: "mine", age: "7d", city: "Hyderabad", review: "complete", followUp: "open", delivery: "all" } });
  });
  it("resolves mine exclusively against the authenticated staff identity", () => {
    expect(assistanceQueueAssignmentWhere("mine", "signed-in-staff")).toEqual({ assignedToId: "signed-in-staff" });
    expect(assistanceQueueAssignmentWhere("unassigned", "signed-in-staff")).toEqual({ assignedToId: null });
    expect(assistanceQueueAssignmentWhere("all", "signed-in-staff")).toEqual({});
  });
  it("retains combined filters through pagination without exposing a staff ID", () => {
    expect(assistanceQueueHref({ status: "UNDER_VERIFICATION", assignment: "mine", order: "oldest", age: "30d", review: "incomplete", followUp: "all" }, 3))
      .toEqual({ pathname: "/admin", query: { status: "UNDER_VERIFICATION", assignment: "mine", order: "oldest", age: "30d", review: "incomplete", page: 3 } });
    expect(assistanceQueueHref({ assignment: "all", order: "newest", age: "all", review: "all", followUp: "all", delivery: "all" })).toEqual({ pathname: "/admin", query: {} });
  });
  it("scopes only unresolved task due dates without inventing an SLA", () => {
    expect(assistanceQueueFollowUpWhere("all", "2026-10-16", "staff-1")).toEqual({});
    expect(assistanceQueueFollowUpWhere("open", "2026-10-16", "staff-1")).toEqual({
      followUps: { some: { state: "OPEN" } },
    });
    expect(assistanceQueueFollowUpWhere("none", "2026-10-16", "staff-1")).toEqual({
      followUps: { none: { state: "OPEN" } },
    });
    expect(assistanceQueueFollowUpWhere("due", "2026-10-16", "staff-1")).toEqual({
      followUps: { some: { state: "OPEN",
        dueOn: { lte: new Date("2026-10-16T00:00:00Z") } } },
    });
    expect(assistanceQueueFollowUpWhere("mine", "2026-10-16", "authenticated-staff")).toEqual({
      followUps: { some: { state: "OPEN", assignedToId: "authenticated-staff" } },
    });
    expect(parseAssistanceQueueFilters({ followUp: "mine" }).followUp).toBe("mine");
    expect(parseAssistanceQueueFilters({ followUp: ["due", "open"] }).followUp).toBe("all");
    expect(parseAssistanceQueueFilters({ followUp: "priority" }).followUp).toBe("all");
  });
  it("never treats unreviewed delivery as independently confirmed support", () => {
    expect(assistanceQueueDeliveryWhere("all")).toEqual({});
    expect(assistanceQueueDeliveryWhere("reported")).toEqual({
      deliveryRecords: { some: { state: "REPORTED" } },
    });
    expect(assistanceQueueDeliveryWhere("confirmed")).toEqual({
      deliveryRecords: { some: { state: "CONFIRMED" } },
    });
    expect(assistanceQueueDeliveryWhere("none")).toEqual({
      deliveryRecords: { none: { state: { in: ["REPORTED", "CONFIRMED"] } } },
    });
    expect(parseAssistanceQueueFilters({ delivery: "confirmed" }).delivery).toBe("confirmed");
    expect(parseAssistanceQueueFilters({ delivery: ["reported"] }).delivery).toBe("all");
    expect(parseAssistanceQueueFilters({ delivery: "PUBLISHED" }).delivery).toBe("all");
  });
  it("scopes incomplete versus completed verification from the persisted completion field", () => {
    expect(assistanceQueueReviewWhere("all")).toEqual({});
    expect(assistanceQueueReviewWhere("complete")).toEqual({
      verification: { is: { completedAt: { not: null } } },
    });
    expect(assistanceQueueReviewWhere("incomplete")).toEqual({
      OR: [
        { verification: { is: null } },
        { verification: { is: { completedAt: null } } },
      ],
    });
  });
  it("distinguishes incomplete verification from an approved review without exposing private notes", () => {
    expect(assistanceQueueVerificationLabel(null)).toBe("Not started");
    expect(assistanceQueueVerificationLabel({ decision: "APPROVED_PUBLIC", completedAt: null })).toBe("In progress");
    const completedAt = new Date("2026-10-15T12:00:00Z");
    expect(assistanceQueueVerificationLabel({ decision: "APPROVED_PUBLIC", completedAt })).toBe("Approved for draft appeal");
    expect(assistanceQueueVerificationLabel({ decision: "APPROVED_PRIVATE", completedAt })).toBe("Approved for private support");
    expect(assistanceQueueVerificationLabel({ decision: "REFERRED", completedAt })).toBe("Referred");
    expect(assistanceQueueVerificationLabel({ decision: "PENDING", completedAt })).toBe("Decision needs review");
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
