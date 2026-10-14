import "server-only";
import type { AcknowledgementRecord } from "@/lib/private-record-response";

const MAX_PRIVATE_PDF_BYTES = 2 * 1024 * 1024;
const MIN_PRIVATE_PDF_BYTES = 16;
const REFERENCE = /^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;

/**
 * Single response boundary for a future reviewed Unicode-capable PDF renderer.
 * Only call AFTER redeemVerifiedReceiptDownloadGrant has rechecked the private
 * donation, original designation, accounting and current privacy state.
 *
 * This function cannot generate or authenticate a PDF. It enforces the private
 * transport, PDF signature, size limit and safe attachment filename.
 */
export function privateReceiptPdfResponse(input: {
  bytes: Uint8Array;
  record: AcknowledgementRecord;
}): Response {
  const { bytes, record } = input;
  const reference = record?.donation?.referenceNumber;
  // The renderer/response boundary must not downgrade an unverified or
  // unsettled transaction into a normal donation acknowledgement.
  if (record?.found !== true || !record.donation.receiptNumber ||
      !["captured", "refunded"].includes(record.presentation.tone)) {
    throw new Error("Receipt PDF requires a completed verified acknowledgement");
  }
  if (typeof reference !== "string" || !REFERENCE.test(reference)) {
    throw new Error("Invalid receipt PDF reference");
  }
  if (!(bytes instanceof Uint8Array) ||
      bytes.byteLength < MIN_PRIVATE_PDF_BYTES ||
      bytes.byteLength > MAX_PRIVATE_PDF_BYTES) {
    throw new Error("Invalid private receipt PDF size");
  }

  // This is a lightweight output type guard, not full PDF conformance checking.
  // The trusted renderer remains responsible for complete, valid PDF structure.
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 10));
  const tail = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, bytes.length - 1024)));
  if (!/^%PDF-(?:1\.[0-7]|2\.0)\r?\n/.test(header) ||
      !/%%EOF\s*$/.test(tail)) throw new Error("Malformed private receipt PDF");

  // Make an owned immutable copy so a caller cannot mutate this response body.
  const body = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  body.set(bytes);
  return new Response(body.buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="amaana-acknowledgement-${reference}.pdf"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store, max-age=0",
      "Pragma": "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}
