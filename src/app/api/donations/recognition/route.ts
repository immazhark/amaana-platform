import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { donorConsentAuditEntry, recognitionVersionWhere } from "@/lib/donor-recognition-consent";
import { refreshShukrViewsAfterConsent } from "@/lib/shukr-cache-refresh";
import { donorRecognitionEnabled, findDonorRecognitionByReceipt, privateRecognitionState } from "@/lib/donor-recognition-repository";
import { parseDonorRecognitionName } from "@/lib/donor-recognition";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive" };
class RecognitionConflictError extends Error {}
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), reference: z.string().trim().min(8).max(80), token: z.string().min(20).max(300) }).strict(),
  z.object({ action: z.literal("request"), reference: z.string().trim().min(8).max(80), token: z.string().min(20).max(300),
    name: z.string().min(2).max(120) }).strict(),
  z.object({ action: z.literal("withdraw"), reference: z.string().trim().min(8).max(80), token: z.string().min(20).max(300) }).strict(),
]);

export async function POST(request: Request) {
  if (!donorRecognitionEnabled()) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: privateHeaders });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateHeaders });
  try {
    if (!(await enforceAcknowledgementRateLimit(request))) return NextResponse.json({ error: "Try again later" }, { status: 429, headers: privateHeaders });
    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, 4 * 1024));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ error: "Request too large" }, { status: 413, headers: privateHeaders });
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: privateHeaders });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: privateHeaders });
    const { reference, token, action } = parsed.data;
    const donation = await findDonorRecognitionByReceipt(reference, token);
    if (!donation) return NextResponse.json({ error: "Record unavailable" }, { status: 404, headers: privateHeaders });

    if (action === "status") {
      return NextResponse.json({ state: privateRecognitionState(donation),
        name: donation.recognitionDisplayName ?? "",
        revocable: Boolean(donation.recognitionRequestedAt || donation.recognitionApprovedAt) &&
          !donation.recognitionRevokedAt }, { headers: privateHeaders });
    }
    if (action === "withdraw") {
      // Withdrawal works after a refund or status change. A no-op is not
      // logged as another consent change. A stale token-authorized view may
      // not overwrite subsequent moderation or a fresh donor request.
      if (!donation.recognitionDisplayName &&
          !donation.recognitionRequestedAt && !donation.recognitionApprovedAt) {
        return NextResponse.json({ state: "inactive", name: "", revocable: false }, { headers: privateHeaders });
      }
      const withdrew = await withSerializableTransactionRetry(async tx => {
        const result = await tx.donation.updateMany({
          where: recognitionVersionWhere(donation),
          data: { recognitionRequestedAt: null, recognitionApprovedAt: null,
            recognitionDisplayName: null, recognitionRevokedAt: new Date() },
        });
        if (result.count !== 1) return false;
        await tx.donorRecognitionConsentEvent.create({
          data: donorConsentAuditEntry(donation.id, "WITHDRAWN"),
        });
        return true;
      });
      if (!withdrew) throw new RecognitionConflictError("Consent state changed");
      refreshShukrViewsAfterConsent();
      return NextResponse.json({ state: "inactive", name: "", revocable: false }, { headers: privateHeaders });
    }

    const name = parseDonorRecognitionName(parsed.data.name);
    if (!name) return NextResponse.json({ error: "Enter a suitable name without contact details." }, { status: 400, headers: privateHeaders });
    if (donation.status !== "CAPTURED" || donation.isAnonymous || donation.refundedAmount.toNumber() !== 0) {
      return NextResponse.json({ error: "Recognition is unavailable for this donation." }, { status: 409, headers: privateHeaders });
    }
    // A new request or name change never inherits a previous staff approval.
    // The mutation and minimal donor-authored history are one serializable
    // unit: no event can exist without its corresponding consent transition.
    const saved = await withSerializableTransactionRetry(async tx => {
      const updated = await tx.donation.updateMany({
        where: { ...recognitionVersionWhere(donation),
          status: "CAPTURED", isAnonymous: false, refundedAmount: 0 },
        data: { recognitionDisplayName: name, recognitionRequestedAt: new Date(),
          recognitionApprovedAt: null, recognitionRevokedAt: null },
      });
      if (updated.count !== 1) return false;
      await tx.donorRecognitionConsentEvent.create({
        data: donorConsentAuditEntry(donation.id, "REQUESTED"),
      });
      return true;
    });
    if (!saved) throw new RecognitionConflictError("Consent state changed");
    refreshShukrViewsAfterConsent();
    return NextResponse.json({ state: "pending", name, revocable: true }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof RecognitionConflictError) {
      return NextResponse.json({ error: "Recognition state changed. Refresh your private receipt." },
        { status: 409, headers: privateHeaders });
    }
    if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ error: "Request too large" }, { status: 413, headers: privateHeaders });
    return NextResponse.json({ error: "Unable to process the preference safely" }, { status: 503, headers: privateHeaders });
  }
}
