import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
