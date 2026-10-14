import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";
import { redeemVerifiedReceiptDownloadGrant } from "@/lib/verified-receipt-download";
import { renderPrivateReceiptPdf } from "@/lib/private-receipt-pdf-renderer";
import { privateReceiptPdfResponse } from "@/lib/private-receipt-pdf-response";
import { isPrivateReceiptPdfEnabled } from "@/lib/receipt-pdf-feature";

export const runtime = "nodejs";
const MAX_BYTES = 1600;
const schema = z.object({
  grant: z.string().min(40).max(1400).regex(/^rd1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/),
}).strict();
const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};

/** Two-step, same-origin POST-only private download. Never accepts a grant
 * in a URL, logs, analytics, or public cache. Activation requires a separate
 * audited Railway font/render-engine installation and explicit release gate. */
export async function POST(request: Request) {
  if (!isPrivateReceiptPdfEnabled()) {
    return NextResponse.json({ available: false }, { status: 404, headers: privateHeaders });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ available: false }, { status: 403, headers: privateHeaders });
  }
  let input: unknown;
  try {
    input = JSON.parse(await readTextBodyWithLimit(request, MAX_BYTES, { timeoutMs: 5000 }));
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413
      : error instanceof RequestBodyReadTimeoutError ? 408 : 404;
    return NextResponse.json({ available: false }, { status, headers: privateHeaders });
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ available: false }, { status: 404, headers: privateHeaders });
  }
  try {
    if (!(await enforceAcknowledgementRateLimit(request))) {
      return NextResponse.json({ available: false }, { status: 429, headers: privateHeaders });
    }
    // Reads current designation, refunds and beneficiary confidentiality again.
    const verified = await redeemVerifiedReceiptDownloadGrant(parsed.data.grant);
    if (!verified) {
      return NextResponse.json({ available: false }, { status: 404, headers: privateHeaders });
    }
    const bytes = await renderPrivateReceiptPdf(verified);
    return privateReceiptPdfResponse({ bytes, record: verified });
  } catch {
    // Service failure is retryable; donors must never resubmit or repay.
    return NextResponse.json({ available: false }, { status: 503, headers: privateHeaders });
  }
}
