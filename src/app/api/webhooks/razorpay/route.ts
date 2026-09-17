import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { captureDonation } from "@/lib/payment-processing";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { validateProductionEnvironment } from "@/lib/env";

type RazorpayEntity = {
  id: string;
  order_id?: string;
  payment_id?: string;
  amount: number;
  currency?: string;
  status?: string;
};

type RazorpayWebhook = {
  event: string;
  payload?: {
    payment?: { entity: RazorpayEntity };
    refund?: { entity: RazorpayEntity };
  };
};

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  let providerEventId: string | null = null;

  try {
    validateProductionEnvironment();

    if (!verifyWebhookSignature(rawBody, signature)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as RazorpayWebhook;
    providerEventId =
      request.headers.get("x-razorpay-event-id") ??
      createHash("sha256").update(rawBody).digest("hex");

    const alreadyProcessed = await prisma.paymentEvent.findUnique({
      where: { providerEventId },
      select: { id: true },
    });
    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }

    const payment = payload.payload?.payment?.entity;
    const refund = payload.payload?.refund?.entity;

    if (payload.event === "payment.captured" && payment?.order_id && payment.currency === "INR") {
      // captureDonation is independently idempotent: only CREATED/AUTHORIZED/FAILED
      // donations can transition to CAPTURED and increment appeal totals. If two
      // copies of the same webhook race, one capture becomes a no-op and the
      // unique PaymentEvent row below resolves the duplicate delivery.
      const result = await captureDonation(payment.order_id, payment.id, payment.amount);
      await prisma.paymentEvent.create({
        data: {
          providerEventId,
          eventType: payload.event,
          donationId: result.donationId,
          payload: JSON.parse(rawBody),
        },
      });
    } else if (payload.event === "payment.failed" && payment?.order_id) {
      // Claim the provider event inside the same transaction as the state change.
      // A concurrent duplicate cannot commit a second donation mutation because
      // providerEventId is unique and the losing transaction rolls back entirely.
      await prisma.$transaction(async tx => {
        const donation = await tx.donation.findUnique({
          where: { providerOrderId: payment.order_id },
          select: { id: true },
        });

        await tx.paymentEvent.create({
          data: {
            providerEventId: providerEventId!,
            eventType: payload.event,
            donationId: donation?.id,
            payload: JSON.parse(rawBody),
          },
        });

        if (donation) {
          await tx.donation.updateMany({
            where: {
              id: donation.id,
              status: { in: ["CREATED", "AUTHORIZED"] },
            },
            data: {
              status: "FAILED",
              failedAt: new Date(),
              providerPaymentId: payment.id,
            },
          });
        }
      });
    } else if (
      payload.event === "refund.processed" &&
      refund?.payment_id &&
      Number.isInteger(refund.amount) &&
      refund.amount > 0
    ) {
      await prisma.$transaction(async tx => {
        const donation = await tx.donation.findUnique({
          where: { providerPaymentId: refund.payment_id },
          select: {
            id: true,
            appealId: true,
            amount: true,
          },
        });

        await tx.paymentEvent.create({
          data: {
            providerEventId: providerEventId!,
            eventType: payload.event,
            donationId: donation?.id,
            payload: JSON.parse(rawBody),
          },
        });

        if (!donation) return;

        const refundAmount = refund.amount / 100;
        const updated = await tx.donation.update({
          where: { id: donation.id },
          data: { refundedAmount: { increment: refundAmount } },
          select: {
            refundedAmount: true,
            amount: true,
          },
        });

        if (updated.refundedAmount.greaterThanOrEqualTo(updated.amount)) {
          await tx.donation.update({
            where: { id: donation.id },
            data: { status: "REFUNDED", refundedAt: new Date() },
          });
        }

        await tx.appeal.update({
          where: { id: donation.appealId },
          data: { amountRaised: { decrement: refundAmount } },
        });
      });
    } else {
      await prisma.paymentEvent.create({
        data: {
          providerEventId,
          eventType: payload.event,
          payload: JSON.parse(rawBody),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Razorpay retries webhooks and can deliver the same event concurrently.
    // If another request committed this providerEventId first, treat the losing
    // unique-key transaction as an acknowledged duplicate instead of returning
    // 500 and causing needless retries. Re-read the row so unrelated P2002
    // errors are never accidentally swallowed.
    if (providerEventId && isUniqueConstraintError(error)) {
      const existing = await prisma.paymentEvent.findUnique({
        where: { providerEventId },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ received: true });
      }
    }

    console.error("Razorpay webhook failed", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}
