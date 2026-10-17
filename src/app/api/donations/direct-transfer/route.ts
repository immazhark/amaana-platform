import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import { RequestBodyTooLargeError, readBodyBytesWithLimit } from "@/lib/bounded-request-body";
import { createDonationReference, createReceiptToken, directTransferSchema, hashReceiptToken, isDonationAmountAllowedForRemaining, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { canExposePublicAppeal } from "@/lib/public-environment";
import { enforceDonationRateLimit, isSameOrigin } from "@/lib/request-security";
import { deleteDonationEvidenceObject, MAX_FILE_BYTES, uploadDonationEvidence } from "@/lib/storage";
import { validateProductionEnvironment } from "@/lib/env";
import { logServerError } from "@/lib/server-log";
import { hasValidDonationEvidenceHeader } from "@/lib/donation-evidence-header";

const privateHeaders = { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" };
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 256 * 1024;

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();
    if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    if (!(await enforceDonationRateLimit(request))) return NextResponse.json({ error: "Too many donation submissions. Please try again later." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
      return NextResponse.json({ error: "Transfer submission must use multipart form data." }, { status: 400, headers: privateHeaders });
    }

    let body: Awaited<ReturnType<typeof readBodyBytesWithLimit>>;
    try {
      body = await readBodyBytesWithLimit(request, MAX_MULTIPART_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Transfer submission is too large." }, { status: 413, headers: privateHeaders });
      }
      throw error;
    }
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });
    let form: FormData;
    try {
      form = await boundedRequest.formData();
    } catch {
      return NextResponse.json({ error: "Transfer submission could not be parsed." }, { status: 400, headers: privateHeaders });
    }
    // Never silently convert malformed or duplicate privacy fields to a named donation.
    // An absent checkbox is legitimate and retains the existing named default.
    const anonymityEntries = form.getAll("isAnonymous");
    if (anonymityEntries.length > 1 || (
      anonymityEntries.length === 1 && anonymityEntries[0] !== "true" && anonymityEntries[0] !== "false"
    )) {
      return NextResponse.json(
        { error: "Please check your privacy choice and submit again." },
        { status: 400, headers: privateHeaders },
      );
    }
    const isAnonymous = anonymityEntries[0] === "true";

    const evidenceEntry = form.get("evidence");
    if (evidenceEntry !== null && evidenceEntry !== "" && !(evidenceEntry instanceof File)) {
      return NextResponse.json({ error: "Please attach a valid transfer screenshot or PDF." }, { status: 400, headers: privateHeaders });
    }
    // An untouched optional file input can be an empty unnamed File; a named
    // zero-byte receipt is invalid evidence and must not be silently discarded.
    if (evidenceEntry instanceof File && evidenceEntry.size === 0 && evidenceEntry.name) {
      return NextResponse.json({ error: "Transfer evidence is empty. Please choose a valid file." }, { status: 400, headers: privateHeaders });
    }
    const evidence = evidenceEntry instanceof File && evidenceEntry.size > 0 ? evidenceEntry : null;
    if (evidence && evidence.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Transfer evidence must be 5 MB or smaller." }, { status: 413, headers: privateHeaders });

    // Storage repeats these byte-signature checks during upload. Validate the small, safe header
    // before creating a financial claim, to avoid reserving a donor's
    // transfer reference for a receipt that is immediately unusable.
    if (evidence && !(await hasValidDonationEvidenceHeader(evidence))) {
      return NextResponse.json(
        { error: "Please attach a valid PDF, JPEG, PNG or WebP receipt." },
        { status: 400, headers: privateHeaders },
      );
    }

    const parsed = directTransferSchema.safeParse({
      appealId: form.get("appealId"), donorName: form.get("donorName"), donorEmail: form.get("donorEmail"), donorPhone: form.get("donorPhone") ?? "",
      amount: form.get("amount"), givingIntent: form.get("givingIntent"), isAnonymous, domesticConfirmed: form.get("domesticConfirmed") === "true",
      paymentMethod: form.get("paymentMethod"), transferReference: form.get("transferReference"), transferredAt: form.get("transferredAt"),
    });
    if (!parsed.success) return NextResponse.json({ error: "Please check the transfer information and reference." }, { status: 400, headers: privateHeaders });

    const appeal = await prisma.appeal.findFirst({
      where: { id: parsed.data.appealId, status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, status: true, goalAmount: true, amountRaised: true, closesAt: true, assistanceRequest: { select: { verification: { select: { zakatStatus: true } } } } },
    });
    if (!appeal || !canExposePublicAppeal(appeal)) return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });
    if (parsed.data.givingIntent === "ZAKAT" && appeal.assistanceRequest?.verification?.zakatStatus !== "ELIGIBLE") return NextResponse.json({ error: "This appeal is not currently marked as Zakat-eligible." }, { status: 409, headers: privateHeaders });
    const remainingAmount = getDonationCheckoutRemainingAmount(appeal);
    if (remainingAmount === null) return NextResponse.json(
      { error: "This appeal is not accepting donations." },
      { status: 409, headers: privateHeaders },
    );
    if (!isDonationAmountAllowedForRemaining(parsed.data.amount, remainingAmount)) return NextResponse.json({ error: parsed.data.amount > remainingAmount ? `This appeal currently needs up to ₹${remainingAmount.toLocaleString("en-IN")} more.` : `The minimum donation is ₹${MIN_DONATION_AMOUNT.toLocaleString("en-IN")}, unless a smaller exact amount is all that remains.`, remainingAmount }, { status: parsed.data.amount > remainingAmount ? 409 : 400, headers: privateHeaders });

    const donationId = randomUUID();
    const referenceNumber = createDonationReference();
    const receiptToken = createReceiptToken();
    let donation;
    try {
      donation = await prisma.donation.create({
        data: {
          id: donationId, referenceNumber, appealId: appeal.id, donorName: parsed.data.donorName, donorEmail: parsed.data.donorEmail.toLowerCase(), donorPhone: parsed.data.donorPhone || null,
          isAnonymous: parsed.data.isAnonymous, givingIntent: parsed.data.givingIntent, domesticConfirmedAt: new Date(), amount: parsed.data.amount,
          status: "PENDING_VERIFICATION", paymentMethod: parsed.data.paymentMethod, provider: null, providerOrderId: null,
          transferReference: parsed.data.transferReference.toUpperCase(), transferredAt: parsed.data.transferredAt, receiptTokenHash: hashReceiptToken(receiptToken),
        }, select: { id: true, referenceNumber: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
        if (target.includes("transferReference")) {
          return NextResponse.json({ error: "This transfer reference has already been submitted. Please do not submit it again." }, { status: 409, headers: privateHeaders });
        }
        throw error;
      }
      // Recover only this request's server-generated ID. A committed write may
      // lose its acknowledgement; looking up the transfer reference instead
      // could disclose a different donor's record or issue the wrong token.
      const recovered = await prisma.donation.findUnique({
        where: { id: donationId },
        select: { id: true, referenceNumber: true, receiptTokenHash: true },
      });
      if (!recovered || recovered.receiptTokenHash !== hashReceiptToken(receiptToken)) throw error;
      donation = recovered;
    }

    let uploadedKey: string | null = null;
    try {
      if (evidence) {
        const uploaded = await uploadDonationEvidence(evidence, donation.id);
        uploadedKey = uploaded.objectKey;
        await prisma.donation.update({ where: { id: donation.id }, data: { transferEvidenceKey: uploaded.objectKey, transferEvidenceName: uploaded.originalName, transferEvidenceMimeType: uploaded.mimeType, transferEvidenceSize: uploaded.sizeBytes } });
      }
    } catch (error) {
      // A storage-metadata write can commit even when its acknowledgement is lost,
      // or an administrator may have verified the transfer concurrently.
      // Never remove an already-updated or verified financial record.
      let removed = false;
      try {
        const cleanup = await prisma.donation.deleteMany({
          where: {
            id: donation.id,
            status: "PENDING_VERIFICATION",
            transferEvidenceKey: null,
          },
        });
        removed = cleanup.count === 1;
      } catch {
        logServerError("donation.direct_transfer_cleanup_failed");
      }

      // Delete the private object only if the unused draft was actually removed.
      // On uncertain database outcomes, preserve both for manual reconciliation.
      if (removed && uploadedKey) {
        await deleteDonationEvidenceObject(uploadedKey, donation.id)
          .catch(() => logServerError("donation.direct_transfer_evidence_cleanup_failed"));
      }
      throw error;
    }

    return NextResponse.json({ referenceNumber: donation.referenceNumber, receiptToken, status: "PENDING_VERIFICATION" }, { status: 202, headers: privateHeaders });
  } catch {
    logServerError("donation.direct_transfer_submission_failed");
    return NextResponse.json({ error: "We could not submit this transfer for verification. Please try again." }, { status: 500, headers: privateHeaders });
  }
}
