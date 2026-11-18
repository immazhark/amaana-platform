import { NextResponse } from "next/server";
import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { donationSchema, fundDonationSchema, isDonationAmountAllowedForRemaining, MIN_DONATION_AMOUNT } from "@/lib/donations";
import { placeRazorpayDonationOrder } from "@/lib/donation-order";
import { resolveFundDestination } from "@/lib/fund-destination";
import { isFundGivingEnabled } from "@/lib/fund-giving-flag";
import { prisma } from "@/lib/prisma";
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

export async function POST(request: Request) {
  let providerAttempted = false;
  try {
    validateProductionEnvironment();
    if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    if (!(await enforceDonationRateLimit(request))) return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });

    let rawBody: string;
    try {
      rawBody = await readTextBodyWithLimit(request, MAX_PAYMENT_JSON_BYTES, { timeoutMs: 5_000 });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Donation request payload is too large." }, { status: 413, headers: privateHeaders });
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        return NextResponse.json(
          { error: "Donation request timed out. Please try again." },
          { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
        );
      }
      // An interrupted transport is not a donor validation error. No payment
      // order or database write has started, so explicit retry is safe.
      return NextResponse.json(
        { error: "Donation request could not be read. Please try again." },
        { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Please check the donation information." }, { status: 400, headers: privateHeaders });
    }

    if (typeof body === "object" && body !== null && !Array.isArray(body) && Object.hasOwn(body, "fundSlug")) {
      return await handleFundOrder(body, () => { providerAttempted = true; });
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
    if (!appeal || !canExposePublicAppeal(appeal)) return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });

    const zakatEligible = appeal.assistanceRequest?.verification?.zakatStatus === "ELIGIBLE";
    if (parsed.data.givingIntent === "ZAKAT" && !zakatEligible) {
      return NextResponse.json(
        { error: "This appeal is not currently marked as Zakat-eligible. Please choose General Charity or Sadaqah." },
        { status: 409, headers: privateHeaders },
      );
    }

    const remainingAmount = getDonationCheckoutRemainingAmount(appeal);
    if (remainingAmount === null) return NextResponse.json(
      { error: "This appeal is not accepting donations." },
      { status: 409, headers: privateHeaders },
    );
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

    const payload = await placeRazorpayDonationOrder({
      donorName: parsed.data.donorName,
      donorEmail: parsed.data.donorEmail,
      donorPhone: parsed.data.donorPhone,
      amount: parsed.data.amount,
      givingIntent: parsed.data.givingIntent,
      isAnonymous: parsed.data.isAnonymous,
      coverProcessingFee: parsed.data.coverProcessingFee,
      destination: { appealId: appeal.id, title: appeal.title },
    }, () => { providerAttempted = true; });
    return NextResponse.json(payload, { status: 201, headers: privateHeaders });
  } catch {
    logServerError("donation.order_creation_failed");
    if (providerAttempted) {
      return NextResponse.json(
        { error: "Checkout status is uncertain. An order may have been created. Contact Amaana before starting another payment." },
        { status: 503, headers: privateHeaders },
      );
    }
    return NextResponse.json(
      { error: "We could not start the secure payment. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}

// Designated giving to a fund. Same checks and order placement as an appeal gift, minus the appeal balance.
async function handleFundOrder(body: unknown, markProviderAttempt: () => void) {
  if (!isFundGivingEnabled()) return NextResponse.json({ error: "This fund is not accepting donations." }, { status: 409, headers: privateHeaders });
  const parsed = fundDonationSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: "Please check the highlighted donation information.", fields: { donorName: fields.donorName, donorEmail: fields.donorEmail, donorPhone: fields.donorPhone, amount: fields.amount, givingIntent: fields.givingIntent, domesticConfirmed: fields.domesticConfirmed } },
      { status: 400, headers: privateHeaders },
    );
  }
  if (parsed.data.amount < MIN_DONATION_AMOUNT) {
    return NextResponse.json({ error: `The minimum donation is ₹${MIN_DONATION_AMOUNT.toLocaleString("en-IN")}.` }, { status: 400, headers: privateHeaders });
  }
  const destination = await resolveFundDestination(prisma, parsed.data);
  if (!destination.ok) return NextResponse.json({ error: destination.error }, { status: destination.status, headers: privateHeaders });
  const payload = await placeRazorpayDonationOrder({
    donorName: parsed.data.donorName,
    donorEmail: parsed.data.donorEmail,
    donorPhone: parsed.data.donorPhone,
    amount: parsed.data.amount,
    givingIntent: parsed.data.givingIntent,
    isAnonymous: parsed.data.isAnonymous,
    coverProcessingFee: parsed.data.coverProcessingFee,
    destination: destination.value,
  }, markProviderAttempt);
  return NextResponse.json(payload, { status: 201, headers: privateHeaders });
}
