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
  } },
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
