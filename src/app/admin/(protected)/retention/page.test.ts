import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ require: vi.fn(), count: vi.fn(), list: vi.fn(), events: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.require }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceDocument: { count: m.count, findMany: m.list }, auditEvent: { findMany: m.events },
} }));
vi.mock("./actions", () => ({ reviewDocumentRetention: vi.fn() }));
vi.mock("@/components/navigation-link", () => ({ default: ({ href, children, ...props }: { href: string | { pathname: string; query: Record<string, string | number> }; children: React.ReactNode }) =>
  createElement("a", { href: typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(Object.entries(href.query).map(([key, value]) => [key, String(value)]))}`, ...props }, children) }));
import Page from "./page";

const document = (status = "CLOSED", appeal: null | { status: string } = null) => ({
  id: "doc-1", assistanceRequestId: "case-1", originalName: "private evidence.pdf", mimeType: "application/pdf", sizeBytes: 1024,
  assistanceRequest: { id: "case-1", referenceNumber: "PRIVATE-REF", status, appeal },
});
const markup = (params = {}) => Page({ searchParams: Promise.resolve(params) }).then(renderToStaticMarkup);

describe("private retention queue", () => {
  beforeEach(() => {
    vi.resetAllMocks(); m.require.mockResolvedValue({ id: "staff" }); m.count.mockResolvedValue(1);
    m.list.mockResolvedValue([document()]); m.events.mockResolvedValue([]);
  });
  it("requires approval permission before every private read", async () => {
    m.require.mockRejectedValue(new Error("Forbidden")); await expect(markup()).rejects.toThrow("Forbidden");
    expect(m.count).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled(); expect(m.events).not.toHaveBeenCalled();
  });
  it.each(["eligible", "active"])("applies %s to document reads as well as counts", async state => {
    m.count.mockResolvedValue(125); const html = await markup({ state, page: "2" });
    const where = m.count.mock.calls[0][0].where;
    expect(where).toBeDefined(); expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 50, take: 50 }));
    expect(state === "active" ? where.NOT : where.OR).toBeDefined();
    expect(html).toContain(`state=${state}&amp;page=3`);
  });
  it("clamps old deep links after queue changes and ignores unknown states", async () => {
    await markup({ state: "DELETE_ALL", page: "999" });
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: undefined, skip: 0, take: 50 }));
  });
  it("selects only the displayed private fields and scopes audit reads to each document and case", async () => {
    await markup(); const query = m.list.mock.calls[0][0];
    expect(query.include).toBeUndefined(); expect(query.select.objectKey).toBeUndefined();
    expect(query.select.assistanceRequest.select.applicantName).toBeUndefined();
    expect(m.events).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      entityType: "AssistanceRequest", OR: [{ entityId: "case-1", metadata: { path: ["documentId"], equals: "doc-1" } }],
    }) }));
  });
  it("does not query audit history or claim the store is empty for an empty filtered page", async () => {
    m.list.mockResolvedValue([]); const html = await markup({ state: "eligible" });
    expect(m.events).not.toHaveBeenCalled(); expect(html).toContain("No private assistance documents match this view.");
  });
  it("connects visible labels to unique document controls", async () => {
    const html = await markup();
    for (const field of ["decision", "reviewAfter", "deleteConfirmation", "reason"]) {
      expect(html).toContain(`for="retention-doc-1-${field}"`); expect(html).toContain(`id="retention-doc-1-${field}"`);
    }
    expect(html).toContain('value="DELETE"');
  });
  it("offers retain or hold for active evidence without a destructive option", async () => {
    m.list.mockResolvedValue([document("UNDER_VERIFICATION")]); const html = await markup();
    expect(html).not.toContain('value="DELETE"'); expect(html).toContain('value="PLACE_HOLD"');
  });
  it("keeps hold release available and deletion unavailable for held terminal evidence", async () => {
    m.events.mockResolvedValue([{ action: "assistance.document_legal_hold_placed", metadata: { documentId: "doc-1" }, createdAt: new Date("2026-10-16T12:00:00Z"), actor: { name: "Reviewer" } }]);
    const html = await markup(); expect(html).toContain('value="RELEASE_HOLD"'); expect(html).not.toContain('value="DELETE"');
    expect(html).toContain('name="expectedHoldCreatedAt" value="2026-10-16T12:00:00.000Z"');
  });
  it("recognises a closed linked appeal without requiring a closed request", async () => {
    m.list.mockResolvedValue([document("UNDER_VERIFICATION", { status: "CLOSED" })]);
    expect(await markup()).toContain('value="DELETE"');
  });
});
