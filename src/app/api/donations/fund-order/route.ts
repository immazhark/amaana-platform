import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { createDonationReference, createReceiptToken, donationSchema, hashReceiptToken, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { approvedFundDesignationSnapshot, FundValidationError } from "@/lib/giving-funds";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";
import { enforceDonationRateLimit, isSameOrigin } from "@/lib/request-security";
import { validateProductionEnvironment } from "@/lib/env";
import { logServerError } from "@/lib/server-log";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const fundOrderSchema = donationSchema.omit({ appealId: true, fundId: true }).extend({
  appealId: z.never().optional(),
  fundId: z.string().cuid(),
  fundRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
}).strict();
const MAX_PAYMENT_JSON_BYTES = 32 * 1024;

/**
 * Dormant until a separately reviewed activation decision sets the server-only
 * AMAANA_FUND_CHECKOUT_ENABLED variable. No public page links to this endpoint.
 * The SQL INSERT trigger independently validates approval and frozen intent
 * against the locked GivingFund row after the provider order is created.
 */
export async function POST(request: Request) {
  if (process.env.AMAANA_FUND_CHECKOUT_ENABLED !== "true") {
    return NextResponse.json({ error: "Fund donations are not available." }, { status: 404, headers: privateHeaders });
  }

  try {
    validateProductionEnvironment();
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    }
    if (!(await enforceDonationRateLimit(request))) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again later." },
        { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, MAX_PAYMENT_JSON_BYTES));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Donation request payload is too large." }, { status: 413, headers: privateHeaders });
      }
      return NextResponse.json({ error: "Please check the donation information." }, { status: 400, headers: privateHeaders });
    }

    const parsed = fundOrderSchema.safeParse(body);
    if (!parsed.success || parsed.data.amount < MIN_DONATION_AMOUNT) {
      return NextResponse.json(
        { error: "Please review the giving fund and donation information." },
        { status: 400, headers: privateHeaders },
      );
    }

    const fund = await prisma.givingFund.findUnique({ where: { id: parsed.data.fundId } });
    if (!fund) {
      return NextResponse.json({ error: "This giving fund is not accepting donations." }, { status: 409, headers: privateHeaders });
    }

    let designationSnapshot;
    try {
      designationSnapshot = approvedFundDesignationSnapshot(fund, parsed.data.fundRevision, parsed.data.givingIntent);
    } catch (error) {
      if (!(error instanceof FundValidationError)) throw error;
      return NextResponse.json({ error: "This giving fund is not accepting donations. Review its current details." }, { status: 409, headers: privateHeaders });
    }

    const amountPaise = parsed.data.amount * 100;
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      throw new Error("Donation amount cannot be represented safely in paise");
    }

    const referenceNumber = createDonationReference();
    const receiptToken = createReceiptToken();
    const order = await createRazorpayOrder({
      amountPaise, receipt: referenceNumber, fundId: fund.id, givingIntent: parsed.data.givingIntent,
    });
    if (
      typeof order.id !== "string" || !/^order_[A-Za-z0-9]+$/.test(order.id) ||
      order.amount !== amountPaise || order.currency !== "INR" ||
      order.receipt !== referenceNumber || order.status !== "created"
    ) {
      throw new Error("Unexpected fund order response");
    }

    const donationId = randomUUID();
    let donation;
    try {
      donation = await prisma.donation.create({
        data: {
          id: donationId, referenceNumber, fundId: fund.id, appealId: null,
          donorName: parsed.data.donorName,
          donorEmail: parsed.data.donorEmail.toLowerCase(),
          donorPhone: parsed.data.donorPhone || null,
          isAnonymous: parsed.data.isAnonymous,
          givingIntent: parsed.data.givingIntent,
          designationSnapshot,
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
      // A database acknowledgement can be lost after committing. Recover by
      // this request's server-generated donation ID, never by donor-supplied
      // identifiers or a possibly reused transfer/payment reference.
      const recovered = await prisma.donation.findUnique({
        where: { id: donationId },
        select: { id: true, donorName: true, donorEmail: true, donorPhone: true, providerOrderId: true, receiptTokenHash: true },
      });
      if (!recovered || recovered.providerOrderId !== order.id ||
          recovered.receiptTokenHash !== hashReceiptToken(receiptToken)) throw error;
      donation = recovered;
    }

    return NextResponse.json({
      donationId: donation.id, orderId: order.id, amount: amountPaise,
      currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      fundName: designationSnapshot.label,
      donor: { name: donation.donorName, email: donation.donorEmail, contact: donation.donorPhone },
      receiptToken,
    }, { status: 201, headers: privateHeaders });
  } catch {
    logServerError("donation.fund_order_creation_failed");
    return NextResponse.json(
      { error: "We could not start the secure payment. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}
