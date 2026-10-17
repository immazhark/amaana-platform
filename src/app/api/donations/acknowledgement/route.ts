import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";
import { readVerifiedDonationAcknowledgement } from "@/lib/private-donation-receipt";

const schema = z.object({
  reference: z.string().trim().min(8).max(80),
  token: z.string().min(20).max(300),
});

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const MAX_ACKNOWLEDGEMENT_JSON_BYTES = 8 * 1024;
// The private acknowledgement browser aborts after 8 seconds. A shorter
// server-side body deadline makes a stalled request recoverable in the UI.
const ACKNOWLEDGEMENT_BODY_TIMEOUT_MS = 5_000;

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ found: false }, { status: 403, headers: privateHeaders });
    }

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, MAX_ACKNOWLEDGEMENT_JSON_BYTES, {
        timeoutMs: ACKNOWLEDGEMENT_BODY_TIMEOUT_MS,
      }));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ found: false }, { status: 413, headers: privateHeaders });
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        // Do not turn an incomplete private request into a false token miss.
        // No receipt quota, token verification or donation lookup occurred.
        return NextResponse.json(
          { found: false },
          { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
        );
      }
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    // A receipt read uses its own keyed abuse bucket, not the donation-order
    // budget. Denial must occur before looking up any private donation.
    if (!(await enforceAcknowledgementRateLimit(request))) {
      return NextResponse.json({ found: false }, { status: 429, headers: privateHeaders });
    }

    const receipt = await readVerifiedDonationAcknowledgement(parsed.data);
    if (!receipt) {
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }
    return NextResponse.json(receipt, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
  }
}
