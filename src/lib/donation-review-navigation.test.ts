import { describe, expect, it } from "vitest";
import { donationDetailHref, donationQueueHref, donationReturnFilters, parsePaymentEventBoundary, paymentEventPage, paymentEventSelection } from "./donation-review-navigation";

describe("donation review navigation", () => {
  it("round-trips approved query fields and encodes the record path", () => {
    expect(donationDetailHref("a/b", { status: "CAPTURED", intent: "GENERAL", method: "RAZORPAY", reference: "afd-2026-12345678", sort: "oldest", issue: "missing-acknowledgement", page: "2", returnTo: "https://outside.invalid" })).toBe("/admin/donations/a%2Fb?queueStatus=CAPTURED&queueIntent=GENERAL&queueMethod=RAZORPAY&queueReference=AFD-2026-12345678&queueSort=oldest&queueIssue=missing-acknowledgement&queuePage=2");
    expect(donationQueueHref(donationReturnFilters({ queueStatus: "CAPTURED", queueMethod: "RAZORPAY", queueSort: "oldest", queuePage: "2" }))).toBe("/admin/donations?status=CAPTURED&method=RAZORPAY&sort=oldest&page=2");
  });
  it("keeps invalid markers but never raw input", () => {
    expect(donationDetailHref("id", { reference: "private@example.invalid", issue: ["missing-refund-time"], status: ["CAPTURED"], method: "unknown", page: "1" })).toBe("/admin/donations/id?queueReference=invalid&queueIssue=invalid");
    expect(donationQueueHref(donationReturnFilters({ queueReference: "invalid", queueIssue: "invalid" }))).toBe("/admin/donations?reference=invalid&issue=invalid");
    expect(donationDetailHref("id", {})).toBe("/admin/donations/id");
  });
  it("refuses malformed and repeated event boundaries", () => {
    for (const value of [undefined, ["2026-11-27T00:00:00.000Z~event"], "2026-02-30T00:00:00.000Z~event", "2026-11-27T00:00:00Z~event", "2026-11-27T00:00:00.000Z~../event", "x".repeat(200)]) expect(parsePaymentEventBoundary(value)).toBeNull();
    const time = new Date("2026-11-27T00:00:00.000Z");
    expect(parsePaymentEventBoundary(time.toISOString()+"~event")).toEqual({ processedAt: time, id: "event" });
  });
  it("bounds the read and uses the last displayed event rather than the sentinel", () => {
    const time = new Date("2026-11-27T00:00:00.000Z");
    const rows = Array.from({ length: 51 }, (_, i) => ({ id: "event-" + i, processedAt: time }));
    expect(paymentEventPage(rows)).toEqual({ events: rows.slice(0, 50), older: rows[49] });
    expect(paymentEventPage(rows.slice(0, 50)).older).toBeNull();
    expect(paymentEventPage([])).toEqual({ events: [], older: null });
    expect(paymentEventSelection(rows[49]!)).toEqual({ where: { OR: [{ processedAt: { lt: time } }, { processedAt: time, id: { lt: "event-49" } }] }, select: { id: true, eventType: true, providerEventId: true, processedAt: true }, orderBy: [{ processedAt: "desc" }, { id: "desc" }], take: 51 });
  });
});
