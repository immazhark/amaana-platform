import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), allowed: vi.fn(), count: vi.fn(), group: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAuthenticatedUser: mocks.authenticate, hasPermission: mocks.allowed, permissionKeys: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { assistanceRequest: { count: mocks.count, groupBy: mocks.group, findMany: mocks.find } } }));
import AdminQueuePage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue({ id: "synthetic-viewer" });
  mocks.allowed.mockReturnValue(true);
  mocks.count.mockResolvedValue(1);
  mocks.group.mockResolvedValue([]);
});

it("shows the received request's IST date across midnight", async () => {
  mocks.find.mockResolvedValue([{ id: "synthetic-request", referenceNumber: "AF-SYNTH", applicantName: "Synthetic applicant", city: "Synthetic city", category: "OTHER", status: "SUBMITTED", assignedTo: null, _count: { documents: 0 }, createdAt: new Date("2026-10-28T20:00:00.000Z") }]);
  const html = renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("<td>29/10/2026</td>");
  expect(html).toContain("Received (IST)");
  expect(mocks.allowed).toHaveBeenCalledWith(expect.anything(), "assistance.view");
});
