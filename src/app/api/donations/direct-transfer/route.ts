import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getRemainingAppealAmount, isAppealOpenForDonations } from "@/lib/appeals";
import { createDonationReference, createReceiptToken, directTransferSchema, hashReceiptToken, isDonationAmountAllowedForRemaining, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { canExposePublicAppeal } from "@/lib/public-environment";
import { enforceDonationRateLimit, isSameOrigin } from "@/lib/request-security";
import { deleteDonationEvidenceObject, MAX_FILE_BYTES, uploadDonationEvidence } from "@/lib/storage";
import { validateProductionEnvironment } from "@/lib/env";

const privateHeaders = { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" };
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 256 * 1024;

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();
    if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    if (!(await enforceDonationRateLimit(request))) return NextResponse.json({ error: "Too many donation submissions. Please try again later." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) return NextResponse.json({ error: "Transfer submission is too large." }, { status: 413, headers: privateHeaders });

    const form = await request.formData();
    const evidence = form.get("evidence");
    if (evidence !== null && (!(evidence instanceof File) || evidence.size <= 0)) return NextResponse.json({ error: "Please attach a valid transfer screenshot or PDF." }, { status: 400, headers: privateHeaders });
    if (evidence instanceof File && evidence.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Transfer evidence must be 5 MB or smaller." }, { status: 413, headers: privateHeaders });

    const parsed = directTransferSchema.safeParse({
      appealId: form.get("appealId"), donorName: form.get("donorName"), donorEmail: form.get("donorEmail"), donorPhone: form.get("donorPhone") ?? "",
      amount: form.get("amount"), givingIntent: form.get("givingIntent"), isAnonymous: form.get("isAnonymous") === "true", domesticConfirmed: form.get("domesticConfirmed") === "true",
      paymentMethod: form.get("paymentMethod"), transferReference: form.get("transferReference"), transferredAt: form.get("transferredAt"),
    });
    if (!parsed.success) return NextResponse.json({ error: "Please check the transfer information and reference." }, { status: 400, headers: privateHeaders });

    const appeal = await prisma.appeal.findFirst({
      where: { id: parsed.data.appealId, status: "PUBLISHED" },
      select: { id: true, status: true, goalAmount: true, amountRaised: true, closesAt: true, assistanceRequest: { select: { verification: { select: { zakatStatus: true } } } } },
    });
    if (!appeal || !canExposePublicAppeal(appeal) || !isAppealOpenForDonations(appeal)) return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });
    if (parsed.data.givingIntent === "ZAKAT" && appeal.assistanceRequest?.verification?.zakatStatus !== "ELIGIBLE") return NextResponse.json({ error: "This appeal is not currently marked as Zakat-eligible." }, { status: 409, headers: privateHeaders });
    const remainingAmount = getRemainingAppealAmount(appeal.amountRaised, appeal.goalAmount);
    if (!isDonationAmountAllowedForRemaining(parsed.data.amount, remainingAmount)) return NextResponse.json({ error: parsed.data.amount > remainingAmount ? `This appeal currently needs up to ₹${remainingAmount.toLocaleString("en-IN")} more.` : `The minimum donation is ₹${MIN_DONATION_AMOUNT.toLocaleString("en-IN")}, unless a smaller exact amount is all that remains.`, remainingAmount }, { status: parsed.data.amount > remainingAmount ? 409 : 400, headers: privateHeaders });

    const referenceNumber = createDonationReference();
    const receiptToken = createReceiptToken();
    let donation;
    try {
      donation = await prisma.donation.create({
        data: {
          referenceNumber, appealId: appeal.id, donorName: parsed.data.donorName, donorEmail: parsed.data.donorEmail.toLowerCase(), donorPhone: parsed.data.donorPhone || null,
          isAnonymous: parsed.data.isAnonymous, givingIntent: parsed.data.givingIntent, domesticConfirmedAt: new Date(), amount: parsed.data.amount,
          status: "PENDING_VERIFICATION", paymentMethod: parsed.data.paymentMethod, provider: null, providerOrderId: null,
          transferReference: parsed.data.transferReference.toUpperCase(), transferredAt: parsed.data.transferredAt, receiptTokenHash: hashReceiptToken(receiptToken),
        }, select: { id: true, referenceNumber: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "This transfer reference has already been submitted. Please do not submit it again." }, { status: 409, headers: privateHeaders });
      throw error;
    }

    let uploadedKey: string | null = null;
    try {
      if (evidence instanceof File) {
        const uploaded = await uploadDonationEvidence(evidence, donation.id);
        uploadedKey = uploaded.objectKey;
        await prisma.donation.update({ where: { id: donation.id }, data: { transferEvidenceKey: uploaded.objectKey, transferEvidenceName: uploaded.originalName, transferEvidenceMimeType: uploaded.mimeType, transferEvidenceSize: uploaded.sizeBytes } });
      }
    } catch (error) {
      if (uploadedKey) await deleteDonationEvidenceObject(uploadedKey, donation.id).catch(() => undefined);
      await prisma.donation.delete({ where: { id: donation.id } }).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({ referenceNumber: donation.referenceNumber, receiptToken, status: "PENDING_VERIFICATION" }, { status: 202, headers: privateHeaders });
  } catch {
    console.error("Direct donation transfer submission failed");
    return NextResponse.json({ error: "We could not submit this transfer for verification. Please try again." }, { status: 500, headers: privateHeaders });
  }
}
