import { describe, expect, it } from "vitest";
import { parsePrivateTrackingFragment, parsePrivateTrackingLocation, privateTrackingPath } from "./private-tracking";

describe("private tracking fragments", () => {
  it("keeps credentials after the URL fragment marker", () => {
    const path = privateTrackingPath("/request-assistance/status", {
      reference: "AF-2026-123456",
      token: "abcdefghijklmnopqrstuvwxyz123456",
    });

    expect(path.startsWith("/request-assistance/status#")).toBe(true);
    expect(path).not.toContain("?");
    expect(path).toContain("reference=AF-2026-123456");
  });

  it("round-trips encoded credentials", () => {
    const credentials = {
      reference: "AF-2026-123456",
      token: "abc_def-ghi+long-token-value-123456",
    };
    const path = privateTrackingPath("/request-assistance/received", credentials);
    const hash = path.slice(path.indexOf("#"));

    expect(parsePrivateTrackingFragment(hash)).toEqual(credentials);
  });

  it("accepts legacy query credentials only as a browser-side fallback", () => {
    const token = "abcdefghijklmnopqrstuvwxyz123456";
    expect(parsePrivateTrackingLocation(`?reference=AF-2026-123456&token=${token}`, "")).toEqual({
      reference: "AF-2026-123456",
      token,
    });
  });

  it("prefers fragment credentials over a legacy query", () => {
    const preferred = "fragment-token-abcdefghijklmnopqrstuvwxyz";
    const legacy = "legacy-token-abcdefghijklmnopqrstuvwxyz";
    expect(parsePrivateTrackingLocation(
      `?reference=OLD&token=${legacy}`,
      `#reference=NEW&token=${preferred}`,
    )).toEqual({ reference: "NEW", token: preferred });
  });

  it("rejects incomplete or short credentials", () => {
    expect(parsePrivateTrackingFragment("")).toBeNull();
    expect(parsePrivateTrackingFragment("#reference=AF-2026-123456")).toBeNull();
    expect(parsePrivateTrackingFragment("#reference=AF-2026-123456&token=short")).toBeNull();
  });
});
