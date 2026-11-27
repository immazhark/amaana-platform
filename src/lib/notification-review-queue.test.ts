import { describe, expect, it } from "vitest";
import { notificationIssueWhere, notificationIssueFilter, notificationQueueOrder } from "./notification-review-queue";
describe("notification review scope", () => {
  const now = new Date("2026-11-27T00:00:00Z");
  it("preserves the existing health thresholds, email scope and terminal sentinel", () => {
    expect(notificationIssueWhere("stale-processing", now)).toEqual({ channel: "EMAIL", status: "PROCESSING", updatedAt: { lt: new Date("2026-11-26T23:45:00Z") } });
    expect(notificationIssueWhere("overdue", now)).toEqual({ channel: "EMAIL", status: { in: ["PENDING", "FAILED"] }, attempts: { lt: 5 }, scheduledFor: { lt: new Date("2026-11-26T23:45:00Z") } });
    expect(notificationIssueWhere("terminal", now)).toEqual({ channel: "EMAIL", status: "FAILED", OR: [{ attempts: { gte: 5 } }, { scheduledFor: { gte: new Date("9999-01-01T00:00:00Z") } }] });
  });
  it("rejects arbitrary and repeated issue selectors without reflecting them", () => {
    for (const value of ["unknown", ["overdue"], null, "private@example.invalid"]) expect(notificationIssueFilter(value, now)).toEqual({ issue: null, invalid: true, where: { id: { in: [] } }, query: { issue: "invalid" } });
    expect(notificationIssueFilter(undefined, now)).toEqual({ issue: null, invalid: false, where: undefined, query: {} });
  });
  it("sorts by the relevant review timestamp with a deterministic tie-breaker", () => {
    expect(notificationQueueOrder("overdue")).toEqual([{ scheduledFor: "asc" }, { id: "asc" }]);
    for (const issue of ["terminal", "stale-processing"] as const) expect(notificationQueueOrder(issue)).toEqual([{ updatedAt: "asc" }, { id: "asc" }]);
    expect(notificationQueueOrder(null)).toEqual([{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }]);
  });
});
