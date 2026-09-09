import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { captureDonation } from "@/lib/payment-processing";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { validateProductionEnvironment } from "@/lib/env";

type RazorpayEntity = { id: string; order_id?: string; payment_id?: string; amount: number; currency?: string; status?: string };
type RazorpayWebhook = { event: string; payload?: { payment?: { entity: RazorpayEntity }; refund?: { entity: RazorpayEntity } } };

export async function POST(request: Request) {
  const rawBody = await request.text(); const signature = request.headers.get("x-razorpay-signature") ?? "";
  try {
    validateProductionEnvironment();
    if (!verifyWebhookSignature(rawBody, signature)) return new NextResponse("Invalid signature", { status: 401 });
    const event = JSON.parse(rawBody) as RazorpayWebhook;
    const providerEventId = request.headers.get("x-razorpay-event-id") ?? createHash("sha256").update(rawBody).digest("hex");
    if (await prisma.paymentEvent.findUnique({ where: { providerEventId } })) return NextResponse.json({ received: true });

    const payment = event.payload?.payment?.entity; const refund = event.payload?.refund?.entity;
    if (event.event === "payment.captured" && payment?.order_id && payment.currency === "INR") {
      const result = await captureDonation(payment.order_id, payment.id, payment.amount);
      await prisma.paymentEvent.create({ data: { providerEventId, eventType: event.event, donationId: result.donationId, payload: JSON.parse(rawBody) } });
    } else if (event.event === "payment.failed" && payment?.order_id) {
      const donation = await prisma.donation.findUnique({ where: { providerOrderId: payment.order_id } });
      if (donation) await prisma.$transaction([prisma.donation.updateMany({ where: { id: donation.id, status: { in: ["CREATED", "AUTHORIZED"] } }, data: { status: "FAILED", failedAt: new Date(), providerPaymentId: payment.id } }), prisma.paymentEvent.create({ data: { providerEventId, eventType: event.event, donationId: donation.id, payload: JSON.parse(rawBody) } })]);
      else await prisma.paymentEvent.create({ data: { providerEventId, eventType: event.event, payload: JSON.parse(rawBody) } });
    } else if (event.event === "refund.processed" && refund?.payment_id && Number.isInteger(refund.amount) && refund.amount > 0) {
      const donation = await prisma.donation.findUnique({ where: { providerPaymentId: refund.payment_id } });
      if (donation) await prisma.$transaction(async tx => {
        const updated = await tx.donation.update({ where: { id: donation.id }, data: { refundedAmount: { increment: refund.amount / 100 } } });
        if (updated.refundedAmount.greaterThanOrEqualTo(updated.amount)) await tx.donation.update({ where: { id: donation.id }, data: { status: "REFUNDED", refundedAt: new Date() } });
        await tx.paymentEvent.create({ data: { providerEventId, eventType: event.event, donationId: donation.id, payload: JSON.parse(rawBody) } });
        await tx.appeal.update({ where: { id: donation.appealId }, data: { amountRaised: { decrement: refund.amount / 100 } } });
      });
      else await prisma.paymentEvent.create({ data: { providerEventId, eventType: event.event, payload: JSON.parse(rawBody) } });
    } else await prisma.paymentEvent.create({ data: { providerEventId, eventType: event.event, payload: JSON.parse(rawBody) } });
    return NextResponse.json({ received: true });
  } catch (error) { console.error("Razorpay webhook failed", error); return new NextResponse("Webhook processing failed", { status: 500 }); }
}
