import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-pagination";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(), allowed: vi.fn(), assets: vi.fn(), count: vi.fn(), groups: vi.fn(), reviews: vi.fn(),
  causes: vi.fn(), initiatives: vi.fn(), stories: vi.fn(), faith: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  mediaAsset: { count: mocks.count, groupBy: mocks.groups, findMany: mocks.assets },
  cause: { findMany: mocks.causes }, initiative: { findMany: mocks.initiatives },
  story: { findMany: mocks.stories }, faithContent: { findMany: mocks.faith }, auditEvent: { findMany: mocks.reviews },
} }));
vi.mock("@/lib/storage", () => ({ getPublicMediaStorageReadiness: () => ({ uploadReady: false }) }));
vi.mock("@/components/curated-gallery-importer", () => ({ CuratedGalleryImporter: () => null }));
vi.mock("./actions", () => ({ createMediaAsset: vi.fn(), deleteMediaAsset: vi.fn(), setMediaPublication: vi.fn(), updateMediaAsset: vi.fn() }));
import AdminMediaPage from "./page";

const optionReads = () => [mocks.causes, mocks.initiatives, mocks.stories, mocks.faith];
beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "synthetic-viewer" });
  mocks.allowed.mockReturnValue(false);
  mocks.assets.mockResolvedValue([{ id: "synthetic-asset", title: "Synthetic media record", kind: "IMAGE", isPublic: false, updatedAt: new Date("2026-10-27T00:00:00Z") }]);
  mocks.count.mockResolvedValue(1);
  mocks.groups.mockResolvedValue([{ isPublic: false, _count: { _all: 1 } }]);
  mocks.reviews.mockResolvedValue([]);
  optionReads().forEach((read, index) => read.mockResolvedValue([{ id: `synthetic-${index}`, title: `Synthetic attachment ${index}` }]));
});

it.each([false, true])("avoids unused attachment reads for a non-editor with approval=%s", async canApprove => {
  mocks.allowed.mockImplementation((_user, permission) => permission === "content.approve" && canApprove);
  const html = renderToStaticMarkup(await AdminMediaPage({ searchParams: Promise.resolve({ visibility: "review" }) }));
  optionReads().forEach(read => expect(read).not.toHaveBeenCalled());
  expect(mocks.permission).toHaveBeenCalledWith("content.view");
  expect(mocks.assets).toHaveBeenCalledWith(expect.objectContaining({ where: { isPublic: false }, take: ADMIN_PAGE_SIZE }));
  expect(mocks.reviews).toHaveBeenCalledOnce();
  expect(html).toContain("Synthetic media record");
  expect(html).not.toContain("Add reviewed media");
  expect(html.includes("Approve privacy gate &amp; publish")).toBe(canApprove);
});

it("keeps all four attachment option lists for editors", async () => {
  mocks.allowed.mockImplementation((_user, permission) => permission === "content.update");
  const html = renderToStaticMarkup(await AdminMediaPage({ searchParams: Promise.resolve({}) }));
  optionReads().forEach((read, index) => {
    expect(read).toHaveBeenCalledOnce();
    expect(read.mock.calls[0]?.[0].select).toEqual({ id: true, title: true });
    expect(html).toContain(`Synthetic attachment ${index}`);
  });
  expect(html).toContain("Add reviewed media");
  expect(html).toContain("Save metadata");
  expect(html).not.toContain("Approve privacy gate &amp; publish");
});

it("makes no database reads when page access is denied", async () => {
  mocks.permission.mockRejectedValue(new Error("denied"));
  await expect(AdminMediaPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("denied");
  [...optionReads(), mocks.count, mocks.groups, mocks.assets, mocks.reviews].forEach(read => expect(read).not.toHaveBeenCalled());
});
