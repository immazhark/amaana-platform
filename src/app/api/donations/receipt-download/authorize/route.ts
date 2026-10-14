import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";
import { issueVerifiedReceiptDownloadGrant } from "@/lib/verified-receipt-download";
import { RECEIPT_DOWNLOAD_GRANT_TTL_SECONDS } from "@/lib/receipt-download-grant";

export const runtime = "nodejs";
const MAX_BYTES = 1024;
const requestSchema = z.object({
  reference: z.string().min(8).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/),
  token: z.string().min(20).max(300).regex(/^[A-Za-z0-9_-]+$/),
}).strict();

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Pragma": "no-cache",
};

/**
 * Disabled-by-default PDF capability preflight. This endpoint returns only
 * an encrypted five-minute POST body grant, NEVER a downloadable link.
 * It cannot by itself produce a PDF or a statutory tax certificate.
 */
export async function POST(request: Request) {
  // Read the private flag before touching a request body, database or limiter.
  // A missing key must fail closed instead of exposing a partly active service.
  if (process.env.AMAANA_RECEIPT_PDF_ENABLED !== "true" ||
      !/^[0-9a-fA-F]{64}$/.test(process.env.RECEIPT_DOWNLOAD_ENCRYPTION_KEY ?? "")) {
    return NextResponse.json({ available: false }, { status: 404, headers: privateHeaders });
  }
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ available: false }, { status: 403, headers: privateHeaders });
    }
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(await readTextBodyWithLimit(request, MAX_BYTES, { timeoutMs: 5000 }));
    } catch (error) {
      const status = error instanceof RequestBodyTooLargeError ? 413
        : error instanceof RequestBodyReadTimeoutError ? 408 : 404;
      return NextResponse.json({ available: false }, { status, headers: privateHeaders });
    }
    const parsed = requestSchema.safeParse(parsedBody);
    if (!parsed.success) {
      return NextResponse.json({ available: false }, { status: 404, headers: privateHeaders });
    }
    if (!(await enforceAcknowledgementRateLimit(request))) {
      return NextResponse.json({ available: false }, { status: 429, headers: privateHeaders });
    }
    const grant = await issueVerifiedReceiptDownloadGrant(parsed.data);
    if (!grant) {
      return NextResponse.json({ available: false }, { status: 404, headers: privateHeaders });
    }
    return NextResponse.json({
      available: true, grant, expiresInSeconds: RECEIPT_DOWNLOAD_GRANT_TTL_SECONDS,
    }, { headers: privateHeaders });
  } catch {
    // Never disclose stored donor identity or the reason a token was rejected.
    return NextResponse.json({ available: false }, { status: 404, headers: privateHeaders });
  }
}
