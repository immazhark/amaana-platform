import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  permission: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAuthenticatedUser: mocks.user,
  hasPermission: mocks.permission,
  permissionKeys: () => ["assistance.view"],
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { assistanceRequest: {
    count: mocks.count,
    groupBy: mocks.groupBy,
    findMany: mocks.findMany,
  }, assistanceIntakeSetting: { findUnique: async () => null } },
}));

import AdminQueuePage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TZ", "UTC");
  mocks.user.mockResolvedValue({ id: "synthetic-operator" });
  mocks.permission.mockReturnValue(true);
  mocks.count.mockResolvedValue(1);
  mocks.groupBy.mockResolvedValue([]);
});

afterEach(() => vi.unstubAllEnvs());

describe("assistance queue India-local received day", () => {
  it.each([
    ["2026-12-31T18:29:59.000Z", "31/12/2026"],
    ["2026-12-31T18:30:00.000Z", "1/1/2027"],
    ["2026-12-31T18:35:00.000Z", "1/1/2027"],
  ])("renders %s under the correct IST day %s on a UTC server", async (timestamp, expected) => {
    mocks.findMany.mockResolvedValueOnce([{
      id: "synthetic-request",
      referenceNumber: "SYNTHETIC-RECEIVED-1",
      applicantName: "Synthetic applicant",
      city: "Synthetic city",
      category: "MEDICAL",
      status: "SUBMITTED",
      assignedTo: null,
      _count: { documents: 0 },
      createdAt: new Date(timestamp),
    }]);

    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({}) }));

    expect(html).toContain("<td>" + expected + "</td>");
    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.permission).toHaveBeenCalledWith({ id: "synthetic-operator" }, "assistance.view");
  });
});

describe("assistance queue minimum displayed-data projection", () => {
  it("selects only displayed case identity, status, date, assigned staff and document count", async () => {
    mocks.findMany.mockResolvedValueOnce([{
      id: "synthetic-request", referenceNumber: "SYNTHETIC-RECEIVED-2",
      applicantName: "Synthetic applicant", city: "Synthetic city",
      category: "MEDICAL", status: "SUBMITTED",
      assignedTo: { name: "Synthetic caseworker" }, _count: { documents: 3 },
      createdAt: new Date("2026-11-09T00:00:00.000Z"),
    }]);

    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({}) }));

    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.permission).toHaveBeenCalledWith({ id: "synthetic-operator" }, "assistance.view");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: {
        id: true,
        referenceNumber: true,
        applicantName: true,
        city: true,
        category: true,
        status: true,
        createdAt: true,
        assignedTo: { select: { name: true } },
        _count: { select: { documents: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
    expect(html).toContain("SYNTHETIC-RECEIVED-2");
    expect(html).toContain("Synthetic applicant");
    expect(html).toContain("Synthetic city");
    expect(html).toContain("Synthetic caseworker");
    expect(html).toContain("<td>3</td>");
  });
});

describe("assistance queue triage order", () => {
  it("supports oldest-first with stable ordering and preserves selected visibility and status", async () => {
    mocks.count.mockResolvedValue(101);
    mocks.findMany.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({
      view: "tests", status: "SUBMITTED", sort: "oldest", page: "2",
    }) }));
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { referenceNumber: "AF-STAGING-ACCEPTANCE", status: "SUBMITTED" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: 50, take: 50,
    }));
    expect(html).toContain("Oldest first");
    expect(html).toContain("sort=oldest");
    expect(html).toContain("page=3");
    expect(html).toContain('href="/admin?view=tests&amp;sort=oldest&amp;status=SUBMITTED&amp;page=3"');
    expect(html).toContain('href="/admin?view=tests&amp;status=SUBMITTED"');
    expect(html).toContain('href="/admin?view=tests&amp;status=SUBMITTED&amp;sort=oldest"');
    expect(html).toContain('href="/admin?view=tests&amp;sort=oldest&amp;status=UNDER_VERIFICATION"');
    expect(html).toContain('href="/admin?sort=oldest&amp;view=tests"');
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>Oldest first<\/a>/);
  });

  it.each([
    { sort: undefined },
    { sort: "invalid" },
    { sort: ["oldest"] },
    { sort: ["oldest", "newest"] },
    { sort: "OLDEST" },
  ])("keeps newest-first for invalid or absent sort $sort", async ({ sort }) => {
    mocks.findMany.mockResolvedValue([]);
    await AdminQueuePage({ searchParams: Promise.resolve({ sort }) });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
  });
});

describe("assistance queue assignment filter", () => {
  it.each([
    { view: undefined, referenceNumber: { not: "AF-STAGING-ACCEPTANCE" } },
    { view: "tests", referenceNumber: "AF-STAGING-ACCEPTANCE" },
  ])("narrows existing visibility scope and status counts to unassigned cases", async ({ view, referenceNumber }) => {
    mocks.count.mockResolvedValue(101);
    mocks.groupBy.mockResolvedValue([{ status: "SUBMITTED", _count: { _all: 101 } }, { status: "UNDER_VERIFICATION", _count: { _all: 4 } }]);
    mocks.findMany.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({
      view, status: "SUBMITTED", assignment: "unassigned", sort: "oldest", page: "2",
    }) }));
    const where = { referenceNumber, assignedToId: null, status: "SUBMITTED" };
    expect(mocks.count).toHaveBeenCalledWith({ where });
    expect(mocks.groupBy).toHaveBeenCalledWith({
      by: ["status"], where: { referenceNumber, assignedToId: null }, _count: { _all: true },
    });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: 50, take: 50,
    }));
    expect(html).toContain("Unassigned only");
    expect(html).toMatch(/>SUBMITTED\s*\(101\)<\/a>/);
    expect(html).toMatch(/>UNDER VERIFICATION\s*\(4\)<\/a>/);
    expect(html).toMatch(/>REJECTED\s*\(0\)<\/a>/);
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>Unassigned only<\/a>/);
    expect(html).toContain("assignment=unassigned&amp;status=SUBMITTED&amp;page=3");
    expect(html).toContain("assignment=unassigned&amp;status=UNDER_VERIFICATION");
    expect(html).toContain("assignment=unassigned&amp;status=SUBMITTED");
  });

  it.each([
    { assignment: undefined }, { assignment: "all" }, { assignment: "assigned" },
    { assignment: ["unassigned"] }, { assignment: ["unassigned", "all"] },
    { assignment: "synthetic-user-id" },
  ])("preserves the default scope for absent or unsupported assignment filters", async ({ assignment }) => {
    mocks.findMany.mockResolvedValue([]);
    await AdminQueuePage({ searchParams: Promise.resolve({ assignment }) });
    expect(mocks.count).toHaveBeenCalledWith({ where: { referenceNumber: { not: "AF-STAGING-ACCEPTANCE" } } });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { referenceNumber: { not: "AF-STAGING-ACCEPTANCE" } },
    }));
  });
});

describe("assistance queue triage authorization boundary", () => {
  it("does not read any case or grouped count if assistance.view is denied", async () => {
    mocks.permission.mockReturnValue(false);
    await expect(AdminQueuePage({ searchParams: Promise.resolve({
      view: "tests", status: "SUBMITTED", sort: "oldest", assignment: "unassigned", page: "2",
    }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.permission).toHaveBeenCalledWith({ id: "synthetic-operator" }, "assistance.view");
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.groupBy).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
