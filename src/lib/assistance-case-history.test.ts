import { describe, expect, it } from "vitest";
import { caseHistoryHref, caseHistoryPage, caseHistoryQuery, parseCaseHistoryBoundary } from "./assistance-case-history";

const at = new Date("2026-11-27T00:00:00.000Z");
describe("private case history keyset", () => {
  it("rejects malformed, noncanonical, repeated and oversized boundaries", () => {
    for (const raw of [undefined, [], ["2026-11-27T00:00:00.000Z~event"], "2026-02-30T00:00:00.000Z~event", "2026-11-27T00:00:00Z~event", "2026-11-27T00:00:00.000Z~../event", "x".repeat(200)]) {
      expect(parseCaseHistoryBoundary(raw)).toBeNull();
    }
    expect(parseCaseHistoryBoundary("2026-11-27T00:00:00.000Z~event")).toEqual({ createdAt: at, id: "event" });
  });
  it("keeps the sentinel out of the page and uses the last displayed event for the next boundary", () => {
    const rows = Array.from({ length: 51 }, (_, index) => ({ id: "event-" + index, createdAt: at }));
    expect(caseHistoryPage(rows)).toEqual({ events: rows.slice(0, 50), older: rows[49] });
    expect(caseHistoryPage(rows.slice(0, 50)).older).toBeNull();
    expect(caseHistoryPage([])).toEqual({ events: [], older: null });
  });
  it("keeps a caller-supplied boundary inside the same case and excludes audit metadata", () => {
    const query = caseHistoryQuery("case-a", { id: "other-event", createdAt: at });
    expect(query.where).toEqual({ entityType: "AssistanceRequest", entityId: "case-a", OR: [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: "other-event" } }] });
    expect(query.select).toEqual({ id: true, action: true, createdAt: true, actor: { select: { name: true } } });
    expect(query.take).toBe(51);
  });
  it("retains only existing queue context and the history anchor", () => {
    expect(caseHistoryHref("case-a", { status: "SUBMITTED", page: "3", arbitrary: "private" }, { id: "event", createdAt: at })).toBe("/admin/requests/case-a?queueStatus=SUBMITTED&queuePage=3&historyBefore=2026-11-27T00%3A00%3A00.000Z~event#audit-history-heading");
    expect(caseHistoryHref("case-a", {})).toBe("/admin/requests/case-a#audit-history-heading");
  });
});
