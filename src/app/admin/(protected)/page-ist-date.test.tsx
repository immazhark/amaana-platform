import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  permission: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  decisions: vi.fn(),
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
    findFirst: mocks.findFirst,
  }, assistanceIntakeSetting: { findUnique: async () => null } },
}));

vi.mock("@/lib/assistance-decision-report", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/assistance-decision-report")>(), loadAssistanceDecisionReport: mocks.decisions }));

import AdminQueuePage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TZ", "UTC");
  mocks.user.mockResolvedValue({ id: "synthetic-operator" });
  mocks.permission.mockReturnValue(true);
  mocks.count.mockResolvedValue(1);
  mocks.groupBy.mockResolvedValue([]);
  mocks.findFirst.mockResolvedValue(null);
  mocks.decisions.mockResolvedValue({ received: 0, recorded: 0, withinDay: 0, withinWeek: 0, overWeek: 0, openWithoutDecision: 0, otherWithoutDecision: 0 });
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
    mocks.groupBy.mockImplementation(async args => args._min ? [] : [{ status: "SUBMITTED", _count: { _all: 101 } }, { status: "UNDER_VERIFICATION", _count: { _all: 4 } }]);
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
    expect(mocks.decisions).not.toHaveBeenCalled();
  });
});

describe("assistance workload labels and record visibility", () => {
  it("reports current stage and receipt age without claiming an unseen first review", async () => {
    mocks.count.mockResolvedValue(0);
    const received = new Date(Date.now() - 3.5 * 86_400_000);
    mocks.groupBy.mockImplementation(async args => args._min ? [
      { status: "SUBMITTED", assignedToId: null, _count: { _all: 3 }, _min: { createdAt: received } },
      { status: "SUBMITTED", assignedToId: "synthetic-operator", _count: { _all: 1 }, _min: { createdAt: received } },
      { status: "DOCUMENTS_REQUESTED", assignedToId: "synthetic-other", _count: { _all: 5 }, _min: { createdAt: received } },
    ] : []);
    mocks.findMany.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({ view: "tests", assignment: "unassigned" }) }));
    expect(html).toContain("4 submitted requests");
    expect(html).toContain("oldest received 3 days ago");
    expect(html).toContain("3 of 9 open requests have no assignee");
    expect(html).toContain("1 open request assigned to you");
    expect(html).toContain("Reviewer workbench");
    expect(html).toContain("Receipt age is not time in the current stage");
    expect(html).not.toContain("awaiting a first review");
    expect(html).not.toContain("synthetic-other");
    expect(html).not.toContain("synthetic-operator");
    expect(html).toContain('href="/admin?view=tests&amp;sort=oldest&amp;assignment=mine&amp;status=SUBMITTED"');
    expect(html).toContain('href="/admin?view=tests&amp;sort=oldest&amp;assignment=unassigned&amp;status=SUBMITTED"');
    expect(mocks.groupBy).toHaveBeenCalledWith({
      by: ["status", "assignedToId"], where: { referenceNumber: "AF-STAGING-ACCEPTANCE", status: { in: ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION"] } },
      _count: { _all: true }, _min: { createdAt: true },
    });
  });

  it.each([
    { view: undefined, referenceNumber: { not: "AF-STAGING-ACCEPTANCE" } },
    { view: "tests", referenceNumber: "AF-STAGING-ACCEPTANCE" },
  ])("narrows personal queue and stage counts to the authenticated reviewer, preserving record visibility", async ({ view, referenceNumber }) => {
    mocks.count.mockResolvedValue(101);
    mocks.findMany.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({
      view, assignment: "mine", status: "UNDER_VERIFICATION", sort: "oldest", page: "2",
    }) }));
    const scope = { referenceNumber, assignedToId: "synthetic-operator" };
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ...scope, status: "UNDER_VERIFICATION" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: 50, take: 50,
    }));
    expect(mocks.groupBy).toHaveBeenCalledWith({ by: ["status"], where: scope, _count: { _all: true } });
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>Assigned to me<\/a>/);
    expect(html).toContain("assignment=mine&amp;status=UNDER_VERIFICATION&amp;page=3");
    expect(html).toContain("assignment=mine&amp;status=SUBMITTED");
  });

  it("does not accept a repeated personal assignment parameter", async () => {
    mocks.findMany.mockResolvedValue([]);
    await AdminQueuePage({ searchParams: Promise.resolve({ assignment: ["mine", "unassigned"] }) });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { referenceNumber: { not: "AF-STAGING-ACCEPTANCE" } },
    }));
  });
});

describe("assistance recorded decision reporting", () => {
  it("shows evidence-based counts in the selected record view without a promised SLA", async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.decisions.mockResolvedValue({ received: 8, recorded: 4, withinDay: 1, withinWeek: 2, overWeek: 1, openWithoutDecision: 2, otherWithoutDecision: 2 });
    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({ view: "tests", status: "SUBMITTED" }) }));
    expect(mocks.decisions).toHaveBeenCalledWith(expect.anything(), "tests");
    expect(html).toContain("4 of 8");
    expect(html).toContain("Decision after 24 hours, within 7 days");
    expect(html).toContain("Other status, no recorded decision");
    expect(html).toContain("not first-review time, case resolution, disbursement, or a promised response time");
    expect(html).not.toContain("SLA achieved");
  });
  it("does not present missing records as zero turnaround", async () => {
    mocks.findMany.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("No requests in this receipt cohort.");
    expect(html).not.toContain("Decision within 24 hours");
  });
});
