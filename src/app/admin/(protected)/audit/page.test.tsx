import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), count: vi.fn(), group: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: { auditEvent: {
  count: mocks.count, groupBy: mocks.group, findMany: mocks.find,
} } }));
import AuditHistoryPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({});
  mocks.count.mockResolvedValue(151);
  mocks.group.mockResolvedValue([]);
  mocks.find.mockResolvedValue([]);
});

describe("audit query normalization", () => {
  it.each(["action", "entityType"] as const)("handles repeated %s without crashing or using ambiguous filters", async key => {
    const search = { [key]: ["first", "second"], page: "2" };
    await expect(AuditHistoryPage({ searchParams: Promise.resolve(search) })).resolves.toBeTruthy();
    expect(mocks.permission).toHaveBeenCalledWith("rbac.manage");
    expect(mocks.count).toHaveBeenCalledWith({ where: {} });
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: {}, skip: 50, take: 50 }));
  });

  it("retains scalar filter trimming, length limits, facets and pagination", async () => {
    const action = ` ${"a".repeat(130)} `;
    await AuditHistoryPage({ searchParams: Promise.resolve({ action, entityType: " Donation ", page: "2" }) });
    const where = { action: "a".repeat(120), entityType: "Donation" };
    expect(mocks.count).toHaveBeenCalledWith({ where });
    expect(mocks.group).toHaveBeenCalledWith(expect.objectContaining({ where: { action: "a".repeat(120) } }));
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 50, take: 50 }));
  });

  it.each([undefined, "Donation"])("clears action and page while preserving entity %s", async entityType => {
    const page = await AuditHistoryPage({ searchParams: Promise.resolve({ action: "reviewed", entityType, page: "3" }) });
    const html = renderToStaticMarkup(page);
    const href = html.match(/<a[^>]*href="([^"]+)"[^>]*>Clear action filter<\/a>/)?.[1];
    expect(href).toBeDefined();
    const target = new URL(href!.replaceAll("&amp;", "&"), "https://amaanafoundation.org");
    expect(target.pathname).toBe("/admin/audit");
    expect(target.searchParams.has("action")).toBe(false);
    expect(target.searchParams.has("page")).toBe(false);
    expect(target.searchParams.get("entityType")).toBe(entityType ?? null);
  });
});


describe("audit empty-view recovery", () => {
  it.each([{ action: "synthetic.action" }, { entityType: "SyntheticEntity" }, { action: "synthetic.action", entityType: "SyntheticEntity" }])("describes no matches for %j and clears every filter", async search => {
    mocks.count.mockResolvedValue(0);
    const html = renderToStaticMarkup(await AuditHistoryPage({ searchParams: Promise.resolve({ ...search, page: "3" }) }));
    expect(html).toContain("No audit events match these filters.");
    expect(html).not.toContain("No audit events have been recorded yet.");
    expect(html).toMatch(/href="\/admin\/audit"[^>]*>View all audit events<\/a>/);
  });

  it("keeps the global empty explanation for an unfiltered audit", async () => {
    mocks.count.mockResolvedValue(0);
    const html = renderToStaticMarkup(await AuditHistoryPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("No audit events have been recorded yet.");
    expect(html).not.toContain("View all audit events");
  });
});
