import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readTextBodyWithLimit: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/assistance", () => ({
  hashTrackingToken: () => "a".repeat(64),
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
    readTextBodyWithLimit: mocks.readTextBodyWithLimit,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: { assistanceRequest: { findUnique: mocks.findUnique } },
}));

vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true }));

import { POST } from "./route";

describe("assistance tracking request bounds", () => {
  it("rejects an oversized tracking payload before database lookup", async () => {
    const { RequestBodyTooLargeError } = await import("@/lib/bounded-request-body");
    mocks.readTextBodyWithLimit.mockRejectedValue(new RequestBodyTooLargeError(8192));

    const response = await POST(new Request("https://amaana.example/api/assistance/status", {
      method: "POST",
      body: "oversized",
    }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ found: false });
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
