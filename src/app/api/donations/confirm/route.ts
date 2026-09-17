import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { hashReceiptToken } from "@/lib/donations";
import { captureDonation } from "@/lib/payment-processing";
import { prisma } from "@/lib/prisma";
import { fetchRazorpayPayment, verifyCheckoutSignature } from "@/lib/razorpay";
import { isSameOrigin } from "@/lib/request-security";
import { validateProductionEnvironment } from "@/lib/env";

const privateHeaders = { "Cache-Control": "no-store, private" };
const MAX_PAYMENT_JSON_BYTES = 32 * 1024;

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  receiptToken: z.string().min(20),
});

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();

    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    }

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, MAX_PAYMENT_JSON_BYTES));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Payment confirmation payload is too large." }, { status: 413, headers: privateHeaders });
      }
      return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400, headers: privateHeaders });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400, headers: privateHeaders });
    }

    const input = parsed.data;
    if (!verifyCheckoutSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400, headers: privateHeaders });
    }

    const donation = await prisma.donation.findUnique({
      where: { providerOrderId: input.razorpay_order_id },
      select: { id: true, amount: true, receiptTokenHash: true, referenceNumber: true, status: true },
    });
    if (!donation || donation.receiptTokenHash !== hashReceiptToken(input.receiptToken)) {
      return NextResponse.json({ error: "Donation record not found." }, { status: 404, headers: privateHeaders });
    }

    const payment = await fetchRazorpayPayment(input.razorpay_payment_id);
    const expectedAmountPaise = donation.amount.mul(100).toNumber();
    if (
      payment.order_id !== input.razorpay_order_id ||
      payment.currency !== "INR" ||
      !Number.isSafeInteger(expectedAmountPaise) ||
      payment.amount !== expectedAmountPaise
    ) {
      throw new Error("Payment verification mismatch");
    }

    const isCaptured = payment.status === "captured" || payment.captured;
    if (isCaptured) {
      await captureDonation(payment.order_id, payment.id, payment.amount);
    } else if (payment.status === "authorized") {
      // A Razorpay order can be retried. A later authorized attempt may follow a
      // failed attempt, but it must never regress an already captured/refunded donation.
      await prisma.donation.updateMany({
        where: { id: donation.id, status: { in: ["CREATED", "FAILED"] } },
        data: { status: "AUTHORIZED", providerPaymentId: payment.id, failedAt: null },
      });
    }

    // Another reconciliation path (most commonly a webhook) may have won the
    // race while this browser confirmation was in flight. Always respond with
    // the persisted donation state instead of assuming our guarded transition
    // changed the row.
    const currentDonation = await prisma.donation.findUnique({
      where: { id: donation.id },
      select: { status: true },
    });
    if (!currentDonation) {
      throw new Error("Donation disappeared during payment confirmation");
    }

    return NextResponse.json(
      {
        referenceNumber: donation.referenceNumber,
        status: currentDonation.status,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    console.error("Donation confirmation failed", error);
    return NextResponse.json(
      { error: "Payment is being verified. Please retain your payment confirmation." },
      { status: 500, headers: privateHeaders },
    );
  }
}
