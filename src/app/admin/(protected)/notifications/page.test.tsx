import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), allowed: vi.fn(), count: vi.fn(), groups: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: { notification: { count: mocks.count, groupBy: mocks.groups, findMany: mocks.find } } }));
vi.mock("./actions", () => ({ enqueueControlledEmailAcceptance: vi.fn(), requeueFailedNotification: vi.fn() }));
import NotificationOperationsPage from "./page";

function row(status: string, overrides: Record<string, unknown> = {}) {
  return { id: "synthetic", status, recipient: "operator@example.invalid", templateKey: "synthetic", subject: "Synthetic operation", attempts: 0, scheduledFor: new Date("2026-10-26T17:00:00Z"), sentAt: null, ...overrides };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "synthetic-viewer" }); mocks.allowed.mockReturnValue(false);
  mocks.count.mockResolvedValue(1); mocks.groups.mockResolvedValue([]); mocks.find.mockResolvedValue([]);
});
async function render(record: ReturnType<typeof row>) {
  if (process.env.AMAANA_EXPECT_TEST_ZONE) expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(process.env.AMAANA_EXPECT_TEST_ZONE);
  mocks.find.mockResolvedValue([record]);
  return renderToStaticMarkup(await NotificationOperationsPage({ searchParams: Promise.resolve({}) }));
}

it.each(["PENDING", "PROCESSING", "FAILED"])("shows the %s schedule in IST", async status => {
  const html = await render(row(status));
  expect(html).toContain("26/10/2026, 10:30:00 pm");
  expect(html).toContain("Next / sent (IST)");
  expect(html).not.toContain("<form");
  expect(mocks.permission).toHaveBeenCalledWith("notification.view");
});
it("shows the actual send instant rather than the old scheduled instant", async () => {
  const html = await render(row("SENT", { sentAt: new Date("2026-10-26T22:00:00Z") }));
  expect(html).toContain("27/10/2026, 3:30:00 am");
  expect(html).not.toContain("26/10/2026, 10:30:00 pm");
});
it("keeps a missing sent timestamp unrecorded", async () => {
  const html = await render(row("SENT"));
  expect(html).not.toContain("26/10/2026");
  const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  const cells = [...body.matchAll(/<td>([\s\S]*?)<\/td>/g)];
  expect(cells[5]?.[1]).toBe("—");
});
it("does not format the terminal retry sentinel as a real delivery date", async () => {
  const html = await render(row("FAILED", { scheduledFor: new Date("9999-01-01T00:00:00Z") }));
  expect(html).toContain("Manual attention required");
  expect(html).not.toContain("9999");
});
