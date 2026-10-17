import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPublicAppealCheckoutEligibility } from "@/lib/public-appeal-checkout";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { appealDonationDesignationSnapshot, createDonationReference, createReceiptToken, donationSchema, hashReceiptToken, isDonationAmountAllowedForRemaining, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";
import { enforceDonationRateLimit, isSameOrigin } from "@/lib/request-security";
import { validateProductionEnvironment } from "@/lib/env";
import { canExposePublicAppeal } from "@/lib/public-environment";
import { logServerError } from "@/lib/server-log";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const MAX_PAYMENT_JSON_BYTES = 32 * 1024;
const ORDER_BODY_TIMEOUT_MS = 15_000;

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();
    if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    if (!(await enforceDonationRateLimit(request))) return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, MAX_PAYMENT_JSON_BYTES, { timeoutMs: ORDER_BODY_TIMEOUT_MS }));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Donation request payload is too large." }, { status: 413, headers: privateHeaders });
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        // Parsing has not completed; no Razorpay order or local donation
        // record was created. Return an explicit no-order outcome so only this
        // known pre-write timeout is safely retryable by the donor UI.
        return NextResponse.json(
          {
            error: "Checkout request upload timed out. No payment order was created. Please check your connection and try again.",
            orderStarted: false,
          },
          { status: 408, headers: privateHeaders },
        );
      }
      return NextResponse.json({ error: "Please check the donation information." }, { status: 400, headers: privateHeaders });
    }

    const parsed = donationSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: "Please check the highlighted donation information.",
          fields: {
            donorName: fields.donorName,
            donorEmail: fields.donorEmail,
            donorPhone: fields.donorPhone,
            amount: fields.amount,
            givingIntent: fields.givingIntent,
            domesticConfirmed: fields.domesticConfirmed,
          },
        },
        { status: 400, headers: privateHeaders },
      );
    }
    const appeal = await prisma.appeal.findFirst({
      where: { id: parsed.data.appealId, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        goalAmount: true,
        amountRaised: true,
        closesAt: true,
        assistanceRequest: {
          select: {
            verification: { select: { zakatStatus: true } },
          },
        },
      },
    });
    // The provider API must enforce the same paise-accurate, whole-rupee
    // checkout eligibility as the public appeal and direct-transfer forms.
    // Otherwise malformed fractional-paise totals could create valid-looking
    // provider orders for donations the public experience forbids.
    if (!appeal || !canExposePublicAppeal(appeal)) {
      return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });
    }
    const eligibility = getPublicAppealCheckoutEligibility(appeal);
    if (!eligibility) {
      return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });
    }

    const zakatEligible = appeal.assistanceRequest?.verification?.zakatStatus === "ELIGIBLE";
    if (parsed.data.givingIntent === "ZAKAT" && !zakatEligible) {
      return NextResponse.json(
        { error: "This appeal is not currently marked as Zakat-eligible. Please choose General Charity or Sadaqah." },
        { status: 409, headers: privateHeaders },
      );
    }

    const remainingAmount = eligibility.progress.remaining;
    if (!isDonationAmountAllowedForRemaining(parsed.data.amount, remainingAmount)) {
      if (parsed.data.amount > remainingAmount) {
        return NextResponse.json(
          {
            error: `This appeal currently needs up to ₹${remainingAmount.toLocaleString("en-IN")} more. Please reduce the donation amount.`,
            remainingAmount,
          },
          { status: 409, headers: privateHeaders },
        );
      }

      return NextResponse.json(
        {
          error: `The minimum donation is ₹${MIN_DONATION_AMOUNT.toLocaleString("en-IN")}, unless a smaller exact amount is all that remains to complete the appeal.`,
          remainingAmount,
        },
        { status: 400, headers: privateHeaders },
      );
    }

    const referenceNumber = createDonationReference(); const receiptToken = createReceiptToken(); const amountPaise = parsed.data.amount * 100;
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) throw new Error("Donation amount cannot be represented safely in paise");
    const order = await createRazorpayOrder({ amountPaise, receipt: referenceNumber, appealId: appeal.id, givingIntent: parsed.data.givingIntent });
    // Never persist a fabricated or unusable provider identity or a non-created order.
    if (
      typeof order.id !== "string" ||
      !/^order_[A-Za-z0-9]+$/.test(order.id) ||
      order.amount !== amountPaise ||
      order.currency !== "INR" ||
      order.receipt !== referenceNumber ||
      order.status !== "created"
    ) {
      throw new Error("Unexpected order response");
    }
    const donationId = randomUUID();
    let donation;
    try {
      donation = await prisma.donation.create({
        data: {
          id: donationId,
          referenceNumber,
          appealId: appeal.id,
          donorName: parsed.data.donorName,
          donorEmail: parsed.data.donorEmail.toLowerCase(),
          donorPhone: parsed.data.donorPhone || null,
          isAnonymous: parsed.data.isAnonymous,
          givingIntent: parsed.data.givingIntent,
          designationSnapshot: appealDonationDesignationSnapshot(appeal, parsed.data.givingIntent),
          domesticConfirmedAt: new Date(),
          amount: parsed.data.amount,
          paymentMethod: "RAZORPAY",
          provider: "RAZORPAY",
          providerOrderId: order.id,
          receiptTokenHash: hashReceiptToken(receiptToken),
        },
        select: { id: true, donorName: true, donorEmail: true, donorPhone: true },
      });
    } catch (error) {
      // The provider order has already been created. Recover this request's
      // committed record without issuing another external order or exposing
      // credentials for a different donation.
      const recovered = await prisma.donation.findUnique({
        where: { id: donationId },
        select: { id: true, donorName: true, donorEmail: true, donorPhone: true, providerOrderId: true, receiptTokenHash: true },
      });
      if (!recovered || recovered.providerOrderId !== order.id || recovered.receiptTokenHash !== hashReceiptToken(receiptToken)) throw error;
      donation = recovered;
    }
    return NextResponse.json({ donationId: donation.id, orderId: order.id, amount: amountPaise, currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, appealTitle: appeal.title, donor: { name: donation.donorName, email: donation.donorEmail, contact: donation.donorPhone }, receiptToken }, { status: 201, headers: privateHeaders });
  } catch {
    logServerError("donation.order_creation_failed");
    return NextResponse.json({ error: "We could not start the secure payment. Please try again." }, { status: 500, headers: privateHeaders });
  }
}
