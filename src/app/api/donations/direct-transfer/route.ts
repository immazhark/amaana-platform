import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readBodyBytesWithLimit } from "@/lib/bounded-request-body";
import { createDonationReference, createReceiptToken, directTransferSchema, fundDirectTransferSchema, hashReceiptToken, isDonationAmountAllowedForRemaining, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { resolveFundDestination } from "@/lib/fund-destination";
import { isFundGivingEnabled } from "@/lib/fund-giving-flag";
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
  let claimOutcomeUnknown = false;
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
      body = await readBodyBytesWithLimit(request, MAX_MULTIPART_BYTES, { timeoutMs: 120_000 });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Transfer submission is too large." }, { status: 413, headers: privateHeaders });
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        return NextResponse.json(
          { error: "Transfer upload timed out. Please try again." },
          { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
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
    // FormData.get() silently takes the first value. Do not let duplicated
    // donation amount, payment identity, donor fields or evidence alter a
    // financial claim through HTTP multipart parameter pollution.
    const scalarFields = [
      "appealId", "fundSlug", "donorDirective", "campaignSlug", "units", "donorName", "donorEmail", "donorPhone", "amount",
      "givingIntent", "paymentMethod", "transferReference", "transferredAt",
    ] as const;
    if (scalarFields.some(field => form.getAll(field).length > 1) || form.getAll("evidence").length > 1) {
      return NextResponse.json(
        { error: "Duplicate transfer fields are not allowed. Please submit one value per field." },
        { status: 400, headers: privateHeaders },
      );
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

    // Consent must be a single explicit positive value. Reject duplicate, absent,
    // or noncanonical fields before any donation or evidence persistence.
    const domesticEntries = form.getAll("domesticConfirmed");
    if (domesticEntries.length !== 1 || domesticEntries[0] !== "true") {
      return NextResponse.json(
        { error: "Please confirm that this donation is domestic." },
        { status: 400, headers: privateHeaders },
      );
    }

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

    const common = {
      donorName: form.get("donorName"), donorEmail: form.get("donorEmail"), donorPhone: form.get("donorPhone") ?? "",
      amount: form.get("amount"), givingIntent: form.get("givingIntent"), isAnonymous, domesticConfirmed: true,
      paymentMethod: form.get("paymentMethod"), transferReference: form.get("transferReference"), transferredAt: form.get("transferredAt"),
    };
    // A submission names exactly one destination: an appeal or a designated fund.
    const fundSlug = form.get("fundSlug");
    // Campaigns belong to funds only.
    if (fundSlug === null && (form.get("campaignSlug") !== null || form.get("units") !== null)) {
      return NextResponse.json({ error: "Campaign gifts must be made to a fund." }, { status: 400, headers: privateHeaders });
    }
    if (fundSlug !== null && !isFundGivingEnabled()) {
      return NextResponse.json({ error: "This fund is not accepting donations." }, { status: 409, headers: privateHeaders });
    }
    if (fundSlug !== null && form.get("appealId") !== null) {
      return NextResponse.json({ error: "Please choose either an appeal or a fund." }, { status: 400, headers: privateHeaders });
    }
    const fundParsed = fundSlug === null ? null : fundDirectTransferSchema.safeParse({ fundSlug, donorDirective: form.get("donorDirective") ?? undefined, campaignSlug: form.get("campaignSlug") ?? undefined, units: form.get("units") ?? undefined, ...common });
    const appealParsed = fundSlug === null ? directTransferSchema.safeParse({ appealId: form.get("appealId"), ...common }) : null;
    const checked = fundParsed ?? appealParsed;
    if (!checked?.success) return NextResponse.json({ error: "Please check the transfer information and reference." }, { status: 400, headers: privateHeaders });
    const data = checked.data;

    let destination: { appealId: string } | { fundId: string; donorDirective: string | null; campaignId?: string; units?: number; unitPrice?: number };
    if (fundParsed?.success) {
      if (data.amount < MIN_DONATION_AMOUNT) return NextResponse.json({ error: `The minimum donation is ₹${MIN_DONATION_AMOUNT.toLocaleString("en-IN")}.` }, { status: 400, headers: privateHeaders });
      const resolved = await resolveFundDestination(prisma, { fundSlug: fundParsed.data.fundSlug, givingIntent: data.givingIntent, donorDirective: fundParsed.data.donorDirective, campaignSlug: fundParsed.data.campaignSlug, units: fundParsed.data.units, amount: data.amount });
      if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: privateHeaders });
      destination = { fundId: resolved.value.fundId, donorDirective: resolved.value.donorDirective, ...(resolved.value.campaignId ? { campaignId: resolved.value.campaignId, units: resolved.value.units, unitPrice: resolved.value.unitPrice } : {}) };
    } else if (appealParsed?.success) {
      const appeal = await prisma.appeal.findFirst({
        where: { id: appealParsed.data.appealId, status: "PUBLISHED" },
        select: { id: true, slug: true, title: true, status: true, goalAmount: true, amountRaised: true, closesAt: true, assistanceRequest: { select: { verification: { select: { zakatStatus: true } } } } },
      });
      if (!appeal || !canExposePublicAppeal(appeal)) return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });
      if (data.givingIntent === "ZAKAT" && appeal.assistanceRequest?.verification?.zakatStatus !== "ELIGIBLE") return NextResponse.json({ error: "This appeal is not currently marked as Zakat-eligible." }, { status: 409, headers: privateHeaders });
      const remainingAmount = getDonationCheckoutRemainingAmount(appeal);
      if (remainingAmount === null) return NextResponse.json(
        { error: "This appeal is not accepting donations." },
        { status: 409, headers: privateHeaders },
      );
      if (!isDonationAmountAllowedForRemaining(data.amount, remainingAmount)) return NextResponse.json({ error: data.amount > remainingAmount ? `This appeal currently needs up to ₹${remainingAmount.toLocaleString("en-IN")} more.` : `The minimum donation is ₹${MIN_DONATION_AMOUNT.toLocaleString("en-IN")}, unless a smaller exact amount is all that remains.`, remainingAmount }, { status: data.amount > remainingAmount ? 409 : 400, headers: privateHeaders });

      destination = { appealId: appeal.id };
    } else {
      return NextResponse.json({ error: "Please check the transfer information and reference." }, { status: 400, headers: privateHeaders });
    }

    const donationId = randomUUID();
    const referenceNumber = createDonationReference();
    const receiptToken = createReceiptToken();
    let donation;
    try {
      claimOutcomeUnknown = true;
      donation = await prisma.donation.create({
        data: {
          id: donationId, referenceNumber, ...destination, donorName: data.donorName, donorEmail: data.donorEmail.toLowerCase(), donorPhone: data.donorPhone || null,
          isAnonymous: data.isAnonymous, givingIntent: data.givingIntent, domesticConfirmedAt: new Date(), amount: data.amount,
          status: "PENDING_VERIFICATION", paymentMethod: data.paymentMethod, provider: null, providerOrderId: null,
          transferReference: data.transferReference.toUpperCase(), transferredAt: data.transferredAt, receiptTokenHash: hashReceiptToken(receiptToken),
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
      if (removed) {
        if (uploadedKey) {
          try {
            await deleteDonationEvidenceObject(uploadedKey, donation.id);
            claimOutcomeUnknown = false;
          } catch {
            logServerError("donation.direct_transfer_evidence_cleanup_failed");
          }
        } else {
          // This claim was deleted and no evidence object was successfully
          // acknowledged, so an identical submission is safe to retry.
          claimOutcomeUnknown = false;
        }
      }
      throw error;
    }

    return NextResponse.json({ referenceNumber: donation.referenceNumber, receiptToken, status: "PENDING_VERIFICATION" }, { status: 202, headers: privateHeaders });
  } catch {
    logServerError("donation.direct_transfer_submission_failed");
    if (claimOutcomeUnknown) {
      // Once a claim write has been attempted, a lost acknowledgement or
      // incomplete compensation must not invite the same UTR to be submitted
      // again. Do not return any private receipt credential on uncertainty.
      return NextResponse.json(
        { error: "Transfer reporting status is uncertain. Your reference may have been recorded. Do not submit the same UTR again; contact Amaana for reconciliation." },
        { status: 503, headers: privateHeaders },
      );
    }
    return NextResponse.json({ error: "We could not submit this transfer for verification. Please try again." }, { status: 500, headers: privateHeaders });
  }
}
