import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), permission: vi.fn(), runtime: vi.fn(), session: vi.fn(),
  transaction: vi.fn(), revalidate: vi.fn(), log: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user, hasPermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: { auditEvent: { findFirst: mocks.session } } }));
vi.mock("@/lib/prisma-transaction", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/prisma-transaction")>(),
  withSerializableTransactionRetry: mocks.transaction,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.log }));
vi.mock("@/lib/curated-gallery-server", () => ({
  CURATED_GALLERY_ENTITY_TYPE: "synthetic-batch",
  CURATED_GALLERY_START_ACTION: "synthetic-start",
  assertCuratedGalleryRuntime: mocks.runtime,
  deriveCuratedGalleryStorage: vi.fn(),
  parseCuratedGallerySessionMetadata: vi.fn(),
}));

import { POST } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
  mocks.user.mockResolvedValue({ id: "synthetic-admin" });
  mocks.permission.mockReturnValue(true);
});
afterEach(() => vi.unstubAllEnvs());

function request(confirmation = "PUBLISH_EXACT_OWNER_CURATED_154") {
  return new Request("https://amaanafoundation.org/api/admin/media/curated-gallery/publish", {
    method: "POST",
    headers: { Origin: "https://amaanafoundation.org", "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation }),
  });
}

function expectPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
  expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
}

describe("gallery publication error disclosure boundary", () => {
  it.each(["authentication", "runtime", "database"])("does not expose %s exceptions", async stage => {
    const diagnostic = new Error("synthetic-private-diagnostic: db-host.example.invalid internal-query-marker");
    if (stage === "authentication") mocks.user.mockRejectedValue(diagnostic);
    if (stage === "runtime") mocks.runtime.mockImplementation(() => { throw diagnostic; });
    if (stage === "database") mocks.session.mockRejectedValue(diagnostic);

    const response = await POST(request());

    expect(response.status).toBe(500);
    expectPrivate(response);
    await expect(response.json()).resolves.toEqual({ error: "Curated gallery publication failed safely." });
    expect(mocks.log).toHaveBeenCalledExactlyOnceWith("curated_gallery.publish_failed", { errorName: "Error" });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
    if (stage === "authentication") {
      expect(mocks.permission).not.toHaveBeenCalled();
      expect(mocks.runtime).not.toHaveBeenCalled();
      expect(mocks.session).not.toHaveBeenCalled();
    }
  });

  it("preserves safe handling of non-Error failures", async () => {
    mocks.user.mockRejectedValue("synthetic-private-diagnostic");
    const response = await POST(request());
    expect(response.status).toBe(500);
    expectPrivate(response);
    await expect(response.json()).resolves.toEqual({ error: "Curated gallery publication failed safely." });
    expect(mocks.log).toHaveBeenCalledWith("curated_gallery.publish_failed", { errorName: "unknown" });
  });

  it("preserves authentication rejection before publication work", async () => {
    mocks.user.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expectPrivate(response);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
    expect(mocks.runtime).not.toHaveBeenCalled();
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it("preserves permission rejection before publication work", async () => {
    mocks.permission.mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(403);
    expectPrivate(response);
    await expect(response.json()).resolves.toEqual({ error: "Content approval permission is required." });
    expect(mocks.runtime).not.toHaveBeenCalled();
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it("preserves explicit confirmation validation", async () => {
    const response = await POST(request("invalid-confirmation"));
    expect(response.status).toBe(400);
    expectPrivate(response);
    await expect(response.json()).resolves.toEqual({ error: "Exact curated gallery publication confirmation is required." });
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
