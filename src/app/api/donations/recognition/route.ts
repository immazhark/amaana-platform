import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";
import { prisma } from "@/lib/prisma";
import { donorRecognitionEnabled, findDonorRecognitionByReceipt, privateRecognitionState } from "@/lib/donor-recognition-repository";
import { parseDonorRecognitionName } from "@/lib/donor-recognition";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive" };
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
    const parsed = schema.safeParse(JSON.parse(await readTextBodyWithLimit(request, 4 * 1024)));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: privateHeaders });
    const { reference, token, action } = parsed.data;
    const donation = await findDonorRecognitionByReceipt(reference, token);
    if (!donation) return NextResponse.json({ error: "Record unavailable" }, { status: 404, headers: privateHeaders });

    if (action === "status") {
      return NextResponse.json({ state: privateRecognitionState(donation),
        name: donation.recognitionDisplayName ?? "" }, { headers: privateHeaders });
    }
    if (action === "withdraw") {
      // Revocation is permitted regardless of donation/refund status, and
      // races safely with moderation by clearing the original request.
      await prisma.donation.updateMany({
        where: { id: donation.id },
        data: { recognitionRequestedAt: null, recognitionApprovedAt: null,
          recognitionDisplayName: null, recognitionRevokedAt: new Date() },
      });
      return NextResponse.json({ state: "inactive", name: "" }, { headers: privateHeaders });
    }

    const name = parseDonorRecognitionName(parsed.data.name);
    if (!name) return NextResponse.json({ error: "Enter a suitable name without contact details." }, { status: 400, headers: privateHeaders });
    if (donation.status !== "CAPTURED" || donation.isAnonymous || donation.refundedAmount.toNumber() !== 0) {
      return NextResponse.json({ error: "Recognition is unavailable for this donation." }, { status: 409, headers: privateHeaders });
    }
    // Name changes always require fresh review; they never inherit approval.
    const saved = await prisma.donation.updateMany({
      where: { id: donation.id, status: "CAPTURED", isAnonymous: false, refundedAmount: 0 },
      data: { recognitionDisplayName: name, recognitionRequestedAt: new Date(),
        recognitionApprovedAt: null, recognitionRevokedAt: null },
    });
    if (saved.count !== 1) return NextResponse.json({ error: "Donation state changed. Retry after refreshing." }, { status: 409, headers: privateHeaders });
    return NextResponse.json({ state: "pending", name }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ error: "Request too large" }, { status: 413, headers: privateHeaders });
    return NextResponse.json({ error: "Unable to process the preference safely" }, { status: 503, headers: privateHeaders });
  }
}
