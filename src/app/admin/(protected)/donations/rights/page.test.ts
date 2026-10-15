import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ require: vi.fn(), enabled: vi.fn(), list: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.require }));
vi.mock("@/lib/donor-rights-repository", () => ({ donorRightsEnabled: m.enabled }));
vi.mock("@/lib/prisma", () => ({ prisma: { donorRightsRequest: { findMany: m.list, count: m.count } } }));
vi.mock("@/components/navigation-link", () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => createElement("a", { href, ...props }, children) }));
vi.mock("./actions", () => ({ reviewDonorRightsAction: vi.fn() }));
import Page from "./page";
const row = (id = "request-00001", status = "OPEN") => ({ id, status, kind: "ACCESS", createdAt: new Date("2026-10-15T09:00:00Z"), donation: { id: "donation-00001", referenceNumber: "PRIVATE-REF" } });
const markup = (params = {}) => Page({ searchParams: Promise.resolve(params) }).then(renderToStaticMarkup);
describe("complete private donor-rights review queue", () => {
  beforeEach(() => { vi.resetAllMocks(); m.require.mockResolvedValue({ id: "staff" }); m.enabled.mockReturnValue(true); m.list.mockResolvedValue([row()]); m.count.mockResolvedValue(1); });
  it("requires reconciliation authority before any read", async () => {
    m.require.mockRejectedValue(new Error("Forbidden")); await expect(markup()).rejects.toThrow("Forbidden"); expect(m.list).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled();
  });
  it("keeps disabled queues unread and avoids a false empty-backlog claim", async () => {
    m.enabled.mockReturnValue(false); const html = await markup(); expect(m.list).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled(); expect(html).not.toContain("No open requests");
  });
  it("looks ahead by one and links to the last displayed request, without rendering the lookahead", async () => {
    m.list.mockResolvedValue(Array.from({ length: 41 }, (_, i) => row(`request-${String(i).padStart(5, "0")}`))); m.count.mockResolvedValue(100);
    const html = await markup();
    expect(html).toContain("100 active requests recorded; showing 40"); expect(html).toContain('href="/admin/donations/rights?after=request-00039"'); expect(html).not.toContain('value="request-00040"');
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ take: 41, orderBy: [{ createdAt: "asc" }, { id: "asc" }] }));
  });
  it("makes closed reviews reachable without offering a new transition", async () => {
    m.list.mockResolvedValue([row("request-00001", "CLOSED")]); const html = await markup({ queue: "closed", after: "request-00000" });
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "CLOSED" }, cursor: { id: "request-00000" }, skip: 1 }));
    expect(m.count).toHaveBeenCalledWith({ where: { status: "CLOSED" } });
    expect(html).not.toContain('name="decision"'); expect(html).toContain('href="/admin/donations/rights?queue=closed"');
  });
  it.each(["<script>", ["request-00001"], "a".repeat(101)])("rejects malformed cursor %j and defaults unknown queues to active", async after => {
    await markup({ queue: "EXPORT_ALL", after });
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: { status: { in: ["OPEN", "IN_REVIEW"] } }, cursor: undefined, skip: undefined }));
  });
  it("offers a reset when a formerly active cursor no longer yields records", async () => {
    m.list.mockResolvedValue([]); const html = await markup({ after: "request-00001" });
    expect(html).toContain("No requests on this page"); expect(html).toContain('href="/admin/donations/rights"'); expect(html).not.toContain("Next requests");
  });
});
