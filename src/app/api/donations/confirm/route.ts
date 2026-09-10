import { NextResponse } from "next/server";
import { z } from "zod";
import { hashReceiptToken } from "@/lib/donations";
import { captureDonation } from "@/lib/payment-processing";
import { prisma } from "@/lib/prisma";
import { fetchRazorpayPayment, verifyCheckoutSignature } from "@/lib/razorpay";
import { isSameOrigin } from "@/lib/request-security";
import { validateProductionEnvironment } from "@/lib/env";

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
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400 });
    }

    const input = parsed.data;
    if (!verifyCheckoutSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({ where: { providerOrderId: input.razorpay_order_id } });
    if (!donation || donation.receiptTokenHash !== hashReceiptToken(input.receiptToken)) {
      return NextResponse.json({ error: "Donation record not found." }, { status: 404 });
    }

    const payment = await fetchRazorpayPayment(input.razorpay_payment_id);
    if (payment.order_id !== input.razorpay_order_id || payment.currency !== "INR") {
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

    return NextResponse.json(
      {
        referenceNumber: donation.referenceNumber,
        status: isCaptured ? "CAPTURED" : payment.status === "authorized" ? "AUTHORIZED" : donation.status,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Donation confirmation failed", error);
    return NextResponse.json(
      { error: "Payment is being verified. Please retain your payment confirmation." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
