import { describe, expect, it } from "vitest";
import { assistanceDocumentSelectionIssue as issue, MAX_ASSISTANCE_DOCUMENT_BYTES } from "./assistance-document-selection";

describe("assistance evidence selection before a private upload", () => {
  it("supports optional evidence and valid PDFs/photographs", () => {
    expect(issue([])).toBeNull();
    expect(issue([{ name:"review.PDF", size:2500 },{ name:"photo.jpeg", size:MAX_ASSISTANCE_DOCUMENT_BYTES }])).toBeNull();
  });
  it("rejects more than five documents before sending multipart bytes", () => {
    expect(issue(Array.from({length:6},(_,i)=>({name:`doc-${i}.pdf`,size:200})))).toMatch(/five/);
  });
  it("rejects empty, oversized and unsupported files", () => {
    expect(issue([{name:"evidence.pdf",size:0}])).toMatch(/empty/);
    expect(issue([{name:"evidence.pdf",size:MAX_ASSISTANCE_DOCUMENT_BYTES+1}])).toMatch(/5 MB/);
    expect(issue([{name:"archive.zip",size:1000}])).toMatch(/PDF/);
  });
  it("accepts a correctly identified media file with no extension", () => {
    expect(issue([{name:"camera-upload",size:1024,type:"image/jpeg"}])).toBeNull();
  });
});
