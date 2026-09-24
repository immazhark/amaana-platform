import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("legacy assistance query-token endpoint", () => {
  it("is permanently retired without reading or echoing private credentials", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(payload).toEqual({
      error: "This private tracking endpoint has been retired. Use the latest Amaana tracking link.",
    });
  });
});
