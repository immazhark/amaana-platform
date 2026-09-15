import { describe, expect, it } from "vitest";
import {
  parsePrivateDonationAcknowledgementLocation,
  privateDonationAcknowledgementPath,
} from "./private-donation-ack";

describe("private donation acknowledgement links", () => {
  it("keeps the receipt token in the browser fragment", () => {
    const path = privateDonationAcknowledgementPath(
      "AFD-2026-12345678",
      "abcdefghijklmnopqrstuvwxyz123456",
    );

    expect(path).toBe(
      "/donations/AFD-2026-12345678/acknowledgement#token=abcdefghijklmnopqrstuvwxyz123456",
    );
    expect(path).not.toContain("?");
  });

  it("prefers the fragment over a legacy query token", () => {
    expect(
      parsePrivateDonationAcknowledgementLocation(
        "?token=legacy-token-abcdefghijklmnopqrstuvwxyz",
        "#token=current-token-abcdefghijklmnopqrstuvwxyz",
      ),
    ).toBe("current-token-abcdefghijklmnopqrstuvwxyz");
  });

  it("keeps legacy preview-era query links usable", () => {
    expect(
      parsePrivateDonationAcknowledgementLocation(
        "?token=legacy-token-abcdefghijklmnopqrstuvwxyz",
        "",
      ),
    ).toBe("legacy-token-abcdefghijklmnopqrstuvwxyz");
  });

  it("rejects missing and short tokens", () => {
    expect(parsePrivateDonationAcknowledgementLocation("", "")).toBeNull();
    expect(parsePrivateDonationAcknowledgementLocation("?token=short", "")).toBeNull();
  });
});
