import { describe, expect, it } from "vitest";
import { getAdminDonationPurpose } from "./admin-donation-purpose";
import { syntheticFundDesignation } from "@/test/fund-designation";

describe("staff donation-purpose exception visibility", () => {
  it("marks valid original fund designation without altering the approved label", () => {
    expect(getAdminDonationPurpose({
      appealId: null, fundId: "approved-fund", givingIntent: "GENERAL",
      designationSnapshot: syntheticFundDesignation("approved-fund"),
      fund: { name: "Renamed public fund" },
    })).toEqual({ label: "Synthetic independently approved fund", provenance: "original", requiresReview: false });
  });

  it("marks unverified fund history as requiring staff reconciliation", () => {
    expect(getAdminDonationPurpose({
      appealId: null, fundId: "approved-fund", givingIntent: "GENERAL",
      designationSnapshot: null, fund: { name: "Renamed public fund" },
    })).toEqual({ label: "Fund designation requires review", provenance: "review", requiresReview: true });
  });

  it("shows legacy appeal provenance without claiming it is the original approved snapshot", () => {
    expect(getAdminDonationPurpose({
      appealId: "legacy-appeal", fundId: null, givingIntent: "GENERAL",
      designationSnapshot: null, appeal: { title: "Current appeal title" },
    })).toEqual({ label: "Current appeal title", provenance: "legacy", requiresReview: false });
  });

  it.each([
    { appealId: null, fundId: null },
    { appealId: "a", fundId: "f" },
  ])("surfaces corrupt missing/mixed destinations without crashing the dashboard", destination => {
    expect(getAdminDonationPurpose({
      ...destination, givingIntent: "GENERAL", designationSnapshot: null,
      appeal: { title: "Should not be shown" }, fund: { name: "Should not be shown" },
    })).toEqual({ label: "Donation destination requires reconciliation",
      provenance: "review", requiresReview: true });
  });

  it("marks mismatched appeal-purpose snapshots rather than using a rewritten title", () => {
    expect(getAdminDonationPurpose({
      appealId: "appeal-1", givingIntent: "GENERAL",
      designationSnapshot: { version: 1, kind: "APPEAL", appealId: "wrong", label: "Tampered title", givingIntent: "GENERAL" },
      appeal: { title: "New title" },
    })).toEqual({ label: "Donation designation requires review", provenance: "review", requiresReview: true });
  });
});
