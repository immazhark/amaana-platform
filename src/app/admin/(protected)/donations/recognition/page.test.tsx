import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), enabled: vi.fn(), list: vi.fn(), count: vi.fn(), events: vi.fn(), eventCount: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.auth }));
vi.mock("@/lib/donor-recognition-repository", () => ({ donorRecognitionEnabled: m.enabled }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  donation: { findMany: m.list, count: m.count },
  donorRecognitionConsentEvent: { findMany: m.events, count: m.eventCount },
} }));
vi.mock("@/components/admin-recognition-review", () => ({ AdminRecognitionReview: ({ donationId }: { donationId: string }) => <span data-review={donationId}>Review request</span> }));
vi.mock("@/components/admin-recognition-unpublish", () => ({ AdminRecognitionUnpublish: ({ donationId }: { donationId: string }) => <span data-remove={donationId}>Remove name</span> }));
import Page from "./page";
const row = { id: "private-donation-00031", referenceNumber: "PRIVATE-REF-31", recognitionDisplayName: "Ayesha Khan", recognitionRequestedAt: new Date("2026-10-10T12:00:00Z"), recognitionApprovedAt: new Date("2026-10-11T12:00:00Z") };
const render = async (params: Record<string, string | string[]> = {}) => renderToStaticMarkup(await Page({ searchParams: Promise.resolve(params) }));
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "staff" }); m.enabled.mockReturnValue(true);
  m.count.mockResolvedValue(90); m.list.mockResolvedValue([row]); m.eventCount.mockResolvedValue(150);
  m.events.mockResolvedValue([{ id: "event-00051", action: "WITHDRAWN", createdAt: new Date("2026-10-11T12:00:00Z"), donationId: row.id, donation: { referenceNumber: row.referenceNumber } }]);
});

describe("complete recognition moderation access", () => {
  it("authorizes before counting or reading any queue", async () => {
    m.auth.mockRejectedValue(new Error("Forbidden")); await expect(render()).rejects.toThrow("Forbidden");
    for (const fn of [m.count, m.list, m.eventCount, m.events]) expect(fn).not.toHaveBeenCalled();
  });
  it("does not query or falsely declare a cleared backlog while disabled", async () => {
    m.enabled.mockReturnValue(false); const html = await render();
    for (const fn of [m.count, m.list, m.eventCount, m.events]) expect(fn).not.toHaveBeenCalled();
    expect(html).toContain("Recognition is disabled"); expect(html).not.toContain("No pending recognition requests");
    expect(html).not.toContain("No approved names"); expect(html).not.toContain('data-review=');
  });
  it("makes later records reachable in all four independent bounded lists", async () => {
    const html = await render({ pendingPage: "2", approvedPage: "3", cleanupPage: "2", consentPage: "2" });
    expect(m.list.mock.calls.map(call => [call[0].skip, call[0].take])).toEqual([[30, 30], [60, 30], [30, 30]]);
    expect(m.events.mock.calls[0]?.[0]).toMatchObject({ skip: 50, take: 50 });
    expect(html).toContain('data-review="private-donation-00031"');
    expect(html).toContain('data-remove="private-donation-00031"');
    expect(html).toContain("Recognition withdrawn");
    expect(html).toContain("Pending recognition pages"); expect(html).toContain("Approved recognition pages");
    expect(html).toContain("Privacy cleanup pages"); expect(html).toContain("Donor consent history pages");
    expect(html).toContain("pendingPage=2&amp;approvedPage=2&amp;cleanupPage=2&amp;consentPage=2#approved-recognition");
    expect(html).not.toContain("first 30 records");
  });
  it("retains publication eligibility for pending names and unfiltered takedown access for approved names", async () => {
    await render(); const [pending, approved, cleanup] = m.count.mock.calls.map(call => call[0].where);
    expect(pending).toMatchObject({ status: "CAPTURED", isAnonymous: false, refundedAmount: 0, recognitionApprovedAt: null, recognitionRevokedAt: null });
    expect(approved).not.toHaveProperty("status"); expect(approved).not.toHaveProperty("isAnonymous");
    expect(approved).not.toHaveProperty("refundedAmount"); expect(approved.recognitionApprovedAt).toEqual({ not: null });
    expect(cleanup.OR).toEqual([{ status: { not: "CAPTURED" } }, { isAnonymous: true }, { refundedAmount: { gt: 0 } }]);
  });
  it("clamps stale deep pages after removals before issuing row queries", async () => {
    m.count.mockResolvedValue(31); m.eventCount.mockResolvedValue(1);
    await render({ pendingPage: "99999999", approvedPage: "99999999", cleanupPage: "99999999", consentPage: "99999999" });
    expect(m.list.mock.calls.map(call => call[0].skip)).toEqual([30, 30, 30]);
    expect(m.events.mock.calls[0]?.[0].skip).toBe(0);
  });
  it.each(["-1", "1.5", "02", "1e3", " 2", "Infinity", "2x", ["2", "3"]])("defaults ambiguous page %s without reflecting it", async value => {
    await render({ approvedPage: value });
    expect(m.list.mock.calls[1]?.[0].skip).toBe(0);
  });
  it("shows malformed legacy names as requiring review instead of silently omitting the row", async () => {
    m.list.mockResolvedValue([{ ...row, recognitionDisplayName: "private@example.org" }]);
    const html = await render();
    expect(html).toContain("Name requires record review"); expect(html).toContain(`/admin/donations/${row.id}`);
    expect(html).not.toContain("private@example.org"); expect(html).not.toContain('data-review='); expect(html).not.toContain('data-remove=');
  });
  it("keeps row projections minimal and private data out of pagination URLs", async () => {
    const html = await render({ approvedPage: "2", email: "PRIVATE_EMAIL" });
    expect(html).not.toContain("PRIVATE_EMAIL"); expect(html).not.toContain("name=Ayesha");
    for (const call of m.list.mock.calls) {
      expect(call[0]).not.toHaveProperty("include");
      for (const key of ["donorEmail", "donorPhone", "receiptTokenHash", "amount", "razorpayPaymentId"]) expect(call[0].select).not.toHaveProperty(key);
    }
    for (const key of ["recognitionDisplayName", "receiptTokenHash", "amount"]) expect(m.events.mock.calls[0]?.[0].select).not.toHaveProperty(key);
  });
});
