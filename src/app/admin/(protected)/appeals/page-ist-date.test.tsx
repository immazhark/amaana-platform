import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(), count: vi.fn(), grouped: vi.fn(), findMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { count: mocks.count, groupBy: mocks.grouped, findMany: mocks.findMany } },
}));

import AdminAppealsPage from "./page";

const money = (value: number) => ({ toNumber: () => value });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TZ", "UTC");
  mocks.permission.mockResolvedValue({ id: "synthetic-appeal-viewer" });
  mocks.count.mockResolvedValue(1);
  mocks.grouped.mockResolvedValue([]);
});
afterEach(() => vi.unstubAllEnvs());

describe("appeal moderation list IST update date", () => {
  it.each([
    ["2026-12-31T18:29:59.000Z", "31/12/2026"],
    ["2026-12-31T18:30:00.000Z", "1/1/2027"],
    ["2026-12-31T18:35:00.000Z", "1/1/2027"],
  ])("shows %s as local calendar day %s on a UTC server", async (utc, date) => {
    mocks.findMany.mockResolvedValueOnce([{
      id: "synthetic-appeal", title: "Synthetic approved case", slug: "synthetic-case",
      status: "DRAFT", goalAmount: money(5000), amountRaised: money(0), closesAt: null, createdBy: { name: "Synthetic editor" },
      reviewedBy: null, updatedAt: new Date(utc),
    }]);
    const html = renderToStaticMarkup(await AdminAppealsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("<td>" + date + "</td>");
    expect(mocks.permission).toHaveBeenCalledWith("appeal.view");
  });

  it("does not read an appeal before enforcing permission", async () => {
    mocks.permission.mockRejectedValueOnce(new Error("appeal.view required"));
    await expect(AdminAppealsPage({ searchParams: Promise.resolve({}) }))
      .rejects.toThrow("appeal.view required");
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

describe("admin appeal listing minimum staff projection", () => {
  it("only rendered appeal and staff fields are queried for the admin list", async () => {
    mocks.findMany.mockResolvedValueOnce([{
      id: "synthetic-appeal", title: "Synthetic approved case", slug: "synthetic-case",
      status: "DRAFT", goalAmount: money(5000), amountRaised: money(0), closesAt: null, createdBy: { name: "Synthetic editor" },
      reviewedBy: { name: "Synthetic reviewer" }, updatedAt: new Date("2026-11-09T00:00:00.000Z"),
    }]);

    const html = renderToStaticMarkup(await AdminAppealsPage({ searchParams: Promise.resolve({}) }));

    expect(mocks.permission).toHaveBeenCalledWith("appeal.view");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        goalAmount: true,
        amountRaised: true,
        closesAt: true,
        updatedAt: true,
        createdBy: { select: { name: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }));
    expect(html).toContain("Synthetic editor");
    expect(html).toContain("Synthetic reviewer");
  });
});


it("distinguishes publication from collection eligibility in the same queue", async () => {
  const base = { title: "Synthetic appeal", slug: "synthetic-case", status: "PUBLISHED", goalAmount: money(100), amountRaised: money(20), closesAt: null, createdBy: { name: "Synthetic editor" }, reviewedBy: null, updatedAt: new Date("2026-11-09T00:00:00Z") };
  mocks.findMany.mockResolvedValueOnce([
    { ...base, id: "open", title: "Synthetic open" },
    { ...base, id: "expired", title: "Synthetic expired", closesAt: new Date("2000-01-01T00:00:00Z") },
    { ...base, id: "funded", title: "Synthetic fully funded", amountRaised: money(100) },
    { ...base, id: "fractional", title: "Synthetic fractional", amountRaised: money(99.99) },
  ]);
  const html = renderToStaticMarkup(await AdminAppealsPage({ searchParams: Promise.resolve({}) }));
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match => match[1]!);
  expect(rows.find(row => row.includes("Synthetic open"))).toContain("Eligible for checkout");
  for (const title of ["Synthetic expired", "Synthetic fully funded", "Synthetic fractional"]) {
    expect(rows.find(row => row.includes(title))).toContain("Not eligible for checkout");
  }
  expect(html).toContain("Remaining limit: ₹80");
});
