import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), logServerError: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { initiative: { findFirst: mocks.findFirst } } }));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.logServerError }));

import { isPublishedTaleemDestination } from "./sponsorship-media";

describe("Taleem destination publication", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reads only the slug of an initiative with a published cause", async () => {
    mocks.findFirst.mockResolvedValue({ slug: "taleem" });
    await expect(isPublishedTaleemDestination()).resolves.toBe(true);
    expect(mocks.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { slug: "taleem", status: "PUBLISHED", cause: { status: "PUBLISHED" } },
      select: { slug: true },
    });
  });

  it("does not link to an unpublished or missing destination", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(isPublishedTaleemDestination()).resolves.toBe(false);
    expect(mocks.logServerError).not.toHaveBeenCalled();
  });

  it("falls back on lookup failure without exposing diagnostics", async () => {
    mocks.findFirst.mockRejectedValue(new Error("PRIVATE_SYNTHETIC_DIAGNOSTIC"));
    await expect(isPublishedTaleemDestination()).resolves.toBe(false);
    expect(mocks.logServerError).toHaveBeenCalledExactlyOnceWith("sponsorship.taleem_destination_unavailable");
  });
});
