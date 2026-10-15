import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";
import { DONOR_RIGHTS_KINDS } from "@/lib/donor-rights";
import {
  donorRightsEnabled, findDonationRightsCapability,
  readDonationRightsStatuses, openDonationRightsRequest,
} from "@/lib/donor-rights-repository";

export const runtime = "nodejs";
const privateHeaders = {
  "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const key = { reference: z.string().trim().min(8).max(80), token: z.string().min(20).max(300) };
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), ...key }).strict(),
  z.object({ action: z.literal("request"), kind: z.enum(DONOR_RIGHTS_KINDS), ...key }).strict(),
]);

export async function POST(request: Request) {
  if (!donorRightsEnabled()) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: privateHeaders });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateHeaders });

  try {
    if (!(await enforceAcknowledgementRateLimit(request))) {
      return NextResponse.json({ error: "Please try later" }, { status: 429, headers: privateHeaders });
    }
    let body: unknown;
    try { body = JSON.parse(await readTextBodyWithLimit(request, 2 * 1024)); }
    catch (error) {
      return NextResponse.json({
        error: error instanceof RequestBodyTooLargeError ? "Request too large" : "Invalid JSON",
      }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400, headers: privateHeaders });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: privateHeaders });

    const { reference, token } = parsed.data;
    const donationId = await findDonationRightsCapability(reference, token);
    if (!donationId) return NextResponse.json({ error: "Private record unavailable" }, { status: 404, headers: privateHeaders });
    if (parsed.data.action === "status") {
      const requests = await readDonationRightsStatuses(donationId);
      return NextResponse.json({ requests }, { headers: privateHeaders });
    }

    // Explicit triage request only. This does not release private information,
    // change the source donation, remove financial records or certify any
    // statutory right without a separate authorized case review.
    const result = await openDonationRightsRequest(donationId, parsed.data.kind);
    return NextResponse.json({
      kind: parsed.data.kind, status: result.status, requestedAt: result.requestedAt,
      message: "Request recorded for staff review. No donation record has been changed.",
    }, { status: 200, headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "Unable to process the request safely" }, { status: 503, headers: privateHeaders });
  }
}
