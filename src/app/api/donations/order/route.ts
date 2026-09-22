import { NextResponse } from "next/server";
import { getRemainingAppealAmount, isAppealOpenForDonations } from "@/lib/appeals";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { createDonationReference, createReceiptToken, donationSchema, hashReceiptToken, isDonationAmountAllowedForRemaining, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";
import { enforceDonationRateLimit, isSameOrigin } from "@/lib/request-security";
import { validateProductionEnvironment } from "@/lib/env";
import { canExposePublicAppeal } from "@/lib/public-environment";

const privateHeaders = { "Cache-Control": "no-store, private" };
const MAX_PAYMENT_JSON_BYTES = 32 * 1024;

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();
    if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    if (!(await enforceDonationRateLimit(request))) return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, MAX_PAYMENT_JSON_BYTES));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Donation request payload is too large." }, { status: 413, headers: privateHeaders });
      }
      return NextResponse.json({ error: "Please check the donation information." }, { status: 400, headers: privateHeaders });
    }

    const parsed = donationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Please check the donation information." }, { status: 400, headers: privateHeaders });
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
    if (!appeal || !canExposePublicAppeal(appeal) || !isAppealOpenForDonations(appeal)) return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });

    const zakatEligible = appeal.assistanceRequest?.verification?.zakatStatus === "ELIGIBLE";
    if (parsed.data.givingIntent === "ZAKAT" && !zakatEligible) {
      return NextResponse.json(
        { error: "This appeal is not currently marked as Zakat-eligible. Please choose General Charity or Sadaqah." },
        { status: 409, headers: privateHeaders },
      );
    }

    const remainingAmount = getRemainingAppealAmount(appeal.amountRaised, appeal.goalAmount);
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
    if (order.amount !== amountPaise || order.currency !== "INR") throw new Error("Unexpected order response");
    const donation = await prisma.donation.create({
      data: { referenceNumber, appealId: appeal.id, donorName: parsed.data.donorName, donorEmail: parsed.data.donorEmail.toLowerCase(), donorPhone: parsed.data.donorPhone || null, isAnonymous: parsed.data.isAnonymous, givingIntent: parsed.data.givingIntent, domesticConfirmedAt: new Date(), amount: parsed.data.amount, providerOrderId: order.id, receiptTokenHash: hashReceiptToken(receiptToken) },
      select: { id: true, donorName: true, donorEmail: true, donorPhone: true },
    });
    return NextResponse.json({ donationId: donation.id, orderId: order.id, amount: amountPaise, currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, appealTitle: appeal.title, donor: { name: donation.donorName, email: donation.donorEmail, contact: donation.donorPhone }, receiptToken }, { status: 201, headers: privateHeaders });
  } catch (error) { console.error("Donation order creation failed", error); return NextResponse.json({ error: "We could not start the secure payment. Please try again." }, { status: 500, headers: privateHeaders }); }
}
