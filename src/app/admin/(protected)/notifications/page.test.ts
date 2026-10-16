import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ require: vi.fn(), has: vi.fn(), count: vi.fn(), grouped: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.require, hasPermission: m.has }));
vi.mock("@/lib/prisma", () => ({ prisma: { notification: { count: m.count, groupBy: m.grouped, findMany: m.list } } }));
vi.mock("./actions", () => ({ enqueueControlledEmailAcceptance: vi.fn(), requeueFailedNotification: vi.fn() }));
vi.mock("@/components/navigation-link", () => ({ default: ({ href, children, ...props }: { href: string | { pathname: string; query: Record<string, string | number> }; children: React.ReactNode }) =>
  createElement("a", { href: typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(Object.entries(href.query).map(([key, value]) => [key, String(value)]))}`, ...props }, children) }));
import Page from "./page";

const row = (channel = "EMAIL", status = "FAILED") => ({
  id: "notification-1", channel, status, recipient: "private@example.test", templateKey: "donation-acknowledgement", subject: "Acknowledgement",
  attempts: 5, failureReason: "Provider unavailable", scheduledFor: new Date("9999-12-31T23:59:59.999Z"), sentAt: null, providerMessageId: null,
  updatedAt: new Date("2026-10-16T12:00:00Z"), assistanceRequestId: null, donationId: "donation-1", donation: { referenceNumber: "PRIVATE-REF" },
});
const markup = (params = {}) => Page({ searchParams: Promise.resolve(params) }).then(renderToStaticMarkup);

describe("actionable notification attention queues", () => {
  beforeEach(() => {
    vi.resetAllMocks(); m.require.mockResolvedValue({ id: "staff" }); m.has.mockReturnValue(false);
    m.count.mockResolvedValue(1); m.grouped.mockResolvedValue([]); m.list.mockResolvedValue([row()]);
  });
  it("requires notification viewing authority before reading delivery records", async () => {
    m.require.mockRejectedValue(new Error("Forbidden")); await expect(markup()).rejects.toThrow("Forbidden");
    expect(m.count).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled();
  });
  it.each(["staleProcessing", "overdueDue", "terminalFailures"])("uses the same %s predicate for health counts and the filtered list", async view => {
    await markup({ view });
    const selected = m.count.mock.calls[0][0].where.AND[0];
    const countIndex = ["staleProcessing", "overdueDue", "terminalFailures"].indexOf(view) + 1;
    expect(selected).toEqual(m.count.mock.calls[countIndex][0].where);
    expect(selected.channel).toBe("EMAIL");
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [selected] }, take: 50, skip: 0 }));
  });
  it("keeps status and attention scope across pages and status changes", async () => {
    m.count.mockResolvedValue(125); const html = await markup({ view: "overdueDue", status: "FAILED", page: "2" });
    expect(m.list.mock.calls[0][0].where.AND[1]).toEqual({ status: "FAILED" });
    expect(m.list.mock.calls[0][0].orderBy).toEqual([{ scheduledFor: "asc" }, { id: "asc" }]);
    expect(html).toContain('href="/admin/notifications?status=FAILED&amp;view=overdueDue&amp;page=3"');
    expect(html).toContain('href="/admin/notifications?view=overdueDue&amp;status=PENDING"');
    expect(html).toContain("Status totals below cover all delivery records.");
  });
  it.each(["untrusted-private-text", ["overdueDue", "terminalFailures"]])("does not reflect unknown or repeated attention filters %j", async view => {
    const html = await markup({ view }); expect(m.count.mock.calls[0][0].where).toBeUndefined();
    expect(html).not.toContain("untrusted-private-text");
  });
  it("shows a read-only stalled view and keeps non-email retry controls unavailable", async () => {
    m.has.mockReturnValue(true); m.list.mockResolvedValue([row("WHATSAPP")]);
    const html = await markup({ view: "staleProcessing" });
    expect(html).toContain("does not restart an in-flight delivery"); expect(html).toContain("WHATSAPP");
    expect(html).not.toContain('name="expectedUpdatedAt"');
  });
  it("offers versioned retry only to managers for failed email records", async () => {
    m.has.mockReturnValue(true); const html = await markup();
    expect(html).toContain('name="expectedUpdatedAt" value="2026-10-16T12:00:00.000Z"');
    expect(html).toContain("Manual attention required");
    m.has.mockReturnValue(false); expect(await markup()).not.toContain('name="expectedUpdatedAt"');
    m.has.mockReturnValue(true); m.list.mockResolvedValue([row("EMAIL", "PROCESSING")]);
    expect(await markup()).not.toContain('name="expectedUpdatedAt"');
  });
  it("clamps empty attention pages and keeps a route back to all records", async () => {
    m.count.mockResolvedValue(0); m.list.mockResolvedValue([]);
    const html = await markup({ view: "terminalFailures", page: "999" });
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 50 }));
    expect(html).toContain("No notifications match this view."); expect(html).toContain("Show all delivery records");
  });
});
