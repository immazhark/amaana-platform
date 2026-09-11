import { NextResponse } from "next/server";
import { createDonationReference, createReceiptToken, donationSchema, hashReceiptToken } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";
import { enforceDonationRateLimit, isSameOrigin } from "@/lib/request-security";
import { validateProductionEnvironment } from "@/lib/env";

const privateHeaders = { "Cache-Control": "no-store, private" };

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();
    if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    if (!(await enforceDonationRateLimit(request))) return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } });
    const parsed = donationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please check the donation information." }, { status: 400, headers: privateHeaders });
    const appeal = await prisma.appeal.findFirst({ where: { id: parsed.data.appealId, status: "PUBLISHED" }, select: { id: true, title: true } });
    if (!appeal) return NextResponse.json({ error: "This appeal is not accepting donations." }, { status: 409, headers: privateHeaders });
    const referenceNumber = createDonationReference(); const receiptToken = createReceiptToken(); const amountPaise = parsed.data.amount * 100;
    const order = await createRazorpayOrder({ amountPaise, receipt: referenceNumber, appealId: appeal.id });
    if (order.amount !== amountPaise || order.currency !== "INR") throw new Error("Unexpected order response");
    const donation = await prisma.donation.create({ data: { referenceNumber, appealId: appeal.id, donorName: parsed.data.donorName, donorEmail: parsed.data.donorEmail.toLowerCase(), donorPhone: parsed.data.donorPhone || null, isAnonymous: parsed.data.isAnonymous, domesticConfirmedAt: new Date(), amount: parsed.data.amount, providerOrderId: order.id, receiptTokenHash: hashReceiptToken(receiptToken) } });
    return NextResponse.json({ donationId: donation.id, orderId: order.id, amount: amountPaise, currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, appealTitle: appeal.title, donor: { name: donation.donorName, email: donation.donorEmail, contact: donation.donorPhone }, receiptToken }, { status: 201, headers: privateHeaders });
  } catch (error) { console.error("Donation order creation failed", error); return NextResponse.json({ error: "We could not start the secure payment. Please try again." }, { status: 500, headers: privateHeaders }); }
}
