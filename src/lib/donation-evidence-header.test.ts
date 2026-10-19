import { describe, expect, it } from "vitest";
import { donationEvidenceUploadIssue, hasValidDonationEvidenceHeader, MAX_DONATION_EVIDENCE_BYTES } from "./donation-evidence-header";

function evidence(mime: string, bytes: number[]) {
  return new File([new Uint8Array(bytes).buffer], "synthetic-receipt", { type: mime });
}

describe("direct-transfer proof pre-persistence header checks", () => {
  it.each([
    ["application/pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]],
    ["image/jpeg", [0xff, 0xd8, 0xff]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["image/webp", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]],
  ] as const)("accepts permitted signed %s proof", async (mime, bytes) => {
    expect(await hasValidDonationEvidenceHeader(evidence(mime, [...bytes]))).toBe(true);
  });

  it.each([
    ["application/pdf", [0x25, 0x50, 0x44, 0x46]],
    ["image/jpeg", [0xff, 0xd8, 0x00]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47]],
    ["image/webp", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x4d, 0x50, 0x34]],
    ["text/plain", [0x25, 0x50, 0x44, 0x46, 0x2d]],
    ["image/png", []],
  ] as const)("rejects malformed or forbidden %s proof", async (mime, bytes) => {
    expect(await hasValidDonationEvidenceHeader(evidence(mime, [...bytes]))).toBe(false);
  });

  it("fails closed if the file header cannot be read", async () => {
    const file = evidence("application/pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]);
    file.slice = () => {
      throw new Error("FILE_READ_FAILED");
    };
    expect(await hasValidDonationEvidenceHeader(file)).toBe(false);
  });
});

describe("direct transfer evidence preflight", () => {
  it("accepts optional empty file controls and supported evidence at the 5 MB limit", () => {
    expect(donationEvidenceUploadIssue(null)).toBeNull();
    expect(donationEvidenceUploadIssue({ name: "", type: "application/octet-stream", size: 0 })).toBeNull();
    expect(donationEvidenceUploadIssue({ name: "valid.pdf", type: "application/pdf", size: MAX_DONATION_EVIDENCE_BYTES })).toBeNull();
  });
  it("rejects oversized, empty or unsupported uploads", () => {
    expect(donationEvidenceUploadIssue({ name: "large.png", type: "image/png", size: MAX_DONATION_EVIDENCE_BYTES + 1 })).toMatch(/5 MB/);
    expect(donationEvidenceUploadIssue({ name: "empty.pdf", type: "application/pdf", size: 0 })).toMatch(/empty/);
    expect(donationEvidenceUploadIssue({ name: "unsupported.txt", type: "text/plain", size: 5 })).toMatch(/PDF/);
  });
});
