import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPublicAppealCheckoutEligibility } from "@/lib/public-appeal-checkout";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readBodyBytesWithLimit } from "@/lib/bounded-request-body";
import { appealDonationDesignationSnapshot, createDonationReference, createReceiptToken, directTransferSchema, hashReceiptToken, isDonationAmountAllowedForRemaining, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { canExposePublicAppeal } from "@/lib/public-environment";
import { enforceDonationRateLimit, isSameOrigin } from "@/lib/request-security";
import { deleteDonationEvidenceObject, MAX_FILE_BYTES, uploadDonationEvidence } from "@/lib/storage";
import { validateProductionEnvironment } from "@/lib/env";
import { logServerError } from "@/lib/server-log";
import { directTransferFieldErrors, UNCERTAIN_TRANSFER_MESSAGE } from "@/lib/direct-transfer-feedback";

const privateHeaders = { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" };
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 256 * 1024;
const TRANSFER_BODY_TIMEOUT_MS = 90_000;

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
      body = await readBodyBytesWithLimit(request, MAX_MULTIPART_BYTES, { timeoutMs: TRANSFER_BODY_TIMEOUT_MS });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Transfer submission is too large." }, { status: 413, headers: privateHeaders });
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        // Multipart reading precedes FormData parsing, evidence storage and the
        // first donation write. This is the only transport deadline for which
        // the server can prove no submission has been recorded.
        return NextResponse.json(
          {
            error: "Transfer upload took too long. No submission was recorded. Check your connection and submit the same bank reference again.",
            submissionUncertain: false,
          },
          { status: 408, headers: privateHeaders },
        );
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
    // Each payment designation and receipt field is single-valued. FormData.get
    // silently selects the first entry, which could disregard a second, different
    // donor intention, reference or attachment supplied by a malformed request.
    const singletonFields = [
      "appealId", "fundId", "donorName", "donorEmail", "donorPhone",
      "amount", "givingIntent", "isAnonymous", "domesticConfirmed",
      "paymentMethod", "transferReference", "transferredAt", "evidence",
    ] as const;
    if (singletonFields.some(field => form.getAll(field).length > 1)) {
      return NextResponse.json(
        { error: "Transfer submission contains duplicate fields. Please review the form." },
        { status: 400, headers: privateHeaders },
      );
    }

    const anonymity = form.get("isAnonymous");
    if (anonymity !== null && anonymity !== "true" && anonymity !== "false") {
      return NextResponse.json(
        { error: "Please choose a valid donor privacy preference." },
        { status: 400, headers: privateHeaders },
      );
    }

    const evidenceEntry = form.get("evidence");
    if (evidenceEntry !== null && evidenceEntry !== "" && !(evidenceEntry instanceof File)) {
      return NextResponse.json({ error: "Please attach a valid transfer screenshot or PDF.", fieldErrors: { evidence: ["Please attach a valid transfer screenshot or PDF."] } }, { status: 400, headers: privateHeaders });
    }
    // An untouched optional file input can be an empty unnamed File; a named
    // zero-byte receipt is invalid evidence and must not be silently discarded.
    if (evidenceEntry instanceof File && evidenceEntry.size === 0 && evidenceEntry.name) {
      return NextResponse.json({ error: "Transfer evidence is empty. Please choose a valid file.", fieldErrors: { evidence: ["Please choose a non-empty file."] } }, { status: 400, headers: privateHeaders });
    }
    const evidence = evidenceEntry instanceof File && evidenceEntry.size > 0 ? evidenceEntry : null;
    if (evidence && evidence.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Transfer evidence must be 5 MB or smaller.", fieldErrors: { evidence: ["Transfer evidence must be 5 MB or smaller."] } }, { status: 413, headers: privateHeaders });

    const parsed = directTransferSchema.safeParse({
      appealId: form.get("appealId"), fundId: form.get("fundId") ?? undefined, donorName: form.get("donorName"), donorEmail: form.get("donorEmail"), donorPhone: form.get("donorPhone") ?? "",
      amount: form.get("amount"), givingIntent: form.get("givingIntent"), isAnonymous: anonymity === "true", domesticConfirmed: form.get("domesticConfirmed") === "true",
      paymentMethod: form.get("paymentMethod"), transferReference: form.get("transferReference"), transferredAt: form.get("transferredAt"),
    });
    if (!parsed.success) return NextResponse.json({ error: "Please check the transfer information and reference.", fieldErrors: directTransferFieldErrors(parsed.error.flatten().fieldErrors) }, { status: 400, headers: privateHeaders });

    const appeal = await prisma.appeal.findFirst({
      where: { id: parsed.data.appealId, status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, status: true, goalAmount: true, amountRaised: true, closesAt: true, assistanceRequest: { select: { verification: { select: { zakatStatus: true } } } } },
    });
    // Use the same paise-accurate, whole-rupee-eligible projection as the
    // public detail and checkout. A direct POST must never bypass a disabled
    // public donation route when the ledger has fractional-paise corruption.
    const eligibility = appeal && canExposePublicAppeal(appeal)
      ? getPublicAppealCheckoutEligibility(appeal) : null;
    if (!eligibility) return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });
    if (parsed.data.givingIntent === "ZAKAT" && appeal.assistanceRequest?.verification?.zakatStatus !== "ELIGIBLE") return NextResponse.json({ error: "This appeal is not currently marked as Zakat-eligible.", fieldErrors: { givingIntent: ["Please choose General Charity or Sadaqah."] } }, { status: 409, headers: privateHeaders });
    const remainingAmount = eligibility.progress.remaining;
    if (!isDonationAmountAllowedForRemaining(parsed.data.amount, remainingAmount)) {
      const error = parsed.data.amount > remainingAmount ? `This appeal currently needs up to ₹${remainingAmount.toLocaleString("en-IN")} more.` : `The minimum donation is ₹${MIN_DONATION_AMOUNT.toLocaleString("en-IN")}, unless a smaller exact amount is all that remains.`;
      return NextResponse.json({ error, remainingAmount, fieldErrors: { amount: [error] } }, { status: parsed.data.amount > remainingAmount ? 409 : 400, headers: privateHeaders });
    }

    const donationId = randomUUID();
    const referenceNumber = createDonationReference();
    const receiptToken = createReceiptToken();
    let donation;
    try {
      donation = await prisma.donation.create({
        data: {
          id: donationId, referenceNumber, appealId: appeal.id, donorName: parsed.data.donorName, donorEmail: parsed.data.donorEmail.toLowerCase(), donorPhone: parsed.data.donorPhone || null,
          isAnonymous: parsed.data.isAnonymous, givingIntent: parsed.data.givingIntent, designationSnapshot: appealDonationDesignationSnapshot(appeal, parsed.data.givingIntent), domesticConfirmedAt: new Date(), amount: parsed.data.amount,
          status: "PENDING_VERIFICATION", paymentMethod: parsed.data.paymentMethod, provider: null, providerOrderId: null,
          transferReference: parsed.data.transferReference.toUpperCase(), transferredAt: parsed.data.transferredAt, receiptTokenHash: hashReceiptToken(receiptToken),
        }, select: { id: true, referenceNumber: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
        if (target.includes("transferReference")) {
          return NextResponse.json({ error: "This transfer reference has already been submitted. Please do not submit it again.", submissionUncertain: true }, { status: 409, headers: privateHeaders });
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
    return NextResponse.json({ error: UNCERTAIN_TRANSFER_MESSAGE, submissionUncertain: true }, { status: 500, headers: privateHeaders });
  }
}
