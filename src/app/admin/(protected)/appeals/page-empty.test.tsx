import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ permission: vi.fn(), count: vi.fn(), group: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: { appeal: {
  count: mocks.count, groupBy: mocks.group, findMany: mocks.find,
} } }));
import AdminAppealsPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({});
  mocks.count.mockResolvedValue(0);
  mocks.group.mockResolvedValue([{ status: "DRAFT", _count: { _all: 2 } }]);
  mocks.find.mockResolvedValue([]);
});

describe("appeal empty-view recovery", () => {
  it("describes no status matches even when other appeals exist", async () => {
    const html = renderToStaticMarkup(await AdminAppealsPage({ searchParams: Promise.resolve({ status: "CLOSED", page: "3" }) }));
    expect(html).toContain("No appeals match this status.");
    expect(html).not.toContain("No appeals have been created.");
    expect(html).toMatch(/href="\/admin\/appeals"[^>]*>View all appeals<\/a>/);
    expect(html).toContain("DRAFT (2)");
    expect(mocks.permission).toHaveBeenCalledWith("appeal.view");
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "CLOSED" }, skip: 0, take: 50 }));
  });

  it.each([undefined, "invalid"])("preserves unfiltered guidance for status %s", async status => {
    mocks.group.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminAppealsPage({ searchParams: Promise.resolve({ status }) }));
    expect(html).toContain("No appeals have been created.");
    expect(html).not.toContain("View all appeals");
  });
});
