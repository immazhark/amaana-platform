import { describe, expect, it } from "vitest";
import {
  assistanceDocumentSelectionIssue,
  MAX_ASSISTANCE_DOCUMENTS,
  MAX_ASSISTANCE_DOCUMENT_BYTES,
} from "./assistance-document-selection";

const pdf = (size = 1024) => ({ name: "report.pdf", size, type: "application/pdf" });

describe("assistance evidence preflight", () => {
  it("permits optional evidence and supported formats up to the exact limits", () => {
    expect(assistanceDocumentSelectionIssue([])).toBeNull();
    expect(assistanceDocumentSelectionIssue([
      pdf(MAX_ASSISTANCE_DOCUMENT_BYTES),
      { name: "photo.jpg", size: 12, type: "image/jpeg" },
      { name: "scan.png", size: 12, type: "image/png" },
      { name: "proof.webp", size: 12, type: "image/webp" },
      pdf(12),
    ])).toBeNull();
    expect(MAX_ASSISTANCE_DOCUMENTS).toBe(5);
  });

  it("rejects six files before an assistance request is sent", () => {
    expect(assistanceDocumentSelectionIssue(Array.from({ length: 6 }, () => pdf())))
      .toMatch(/no more than five/i);
  });

  it("rejects oversized, empty and invalid document sizes", () => {
    for (const size of [0, -1, NaN, Infinity, 0.5]) {
      expect(assistanceDocumentSelectionIssue([pdf(size)])).toMatch(/empty or invalid/i);
    }
    expect(assistanceDocumentSelectionIssue([pdf(MAX_ASSISTANCE_DOCUMENT_BYTES + 1)]))
      .toMatch(/5 MB or smaller/i);
  });

  it("requires a server-supported MIME type, regardless of filename", () => {
    for (const type of ["", "text/plain", "application/octet-stream", "image/svg+xml"]) {
      expect(assistanceDocumentSelectionIssue([{ name: "receipt.pdf", size: 1024, type }]))
        .toMatch(/PDF, JPEG, PNG or WebP/i);
    }
    expect(assistanceDocumentSelectionIssue([{ name: "receipt.txt", size: 1024, type: "application/pdf" }]))
      .toBeNull();
  });
});
