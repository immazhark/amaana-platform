import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { appealStatusAfterRefund } from "@/lib/appeals";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { paymentEventAuditPayload } from "@/lib/payment-event-audit";
import { captureDonation, ensureCapturedDonationForRefund } from "@/lib/payment-processing";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { calculateRefundAccounting } from "@/lib/refund-accounting";
import { validateProductionEnvironment } from "@/lib/env";
import { isPrismaUniqueConstraintError } from "@/lib/webhook-idempotency";

const MAX_RAZORPAY_WEBHOOK_BYTES = 256 * 1024;

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

function decimalRupeesToPaise(value: { mul: (amount: number) => { toNumber: () => number } }) {
  const paise = value.mul(100).toNumber();
  if (!Number.isSafeInteger(paise) || paise < 0) {
    throw new Error("Stored financial amount cannot be represented safely in paise");
  }
  return paise;
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  let providerEventId: string | null = null;

  try {
    validateProductionEnvironment();
    const rawBody = await readTextBodyWithLimit(request, MAX_RAZORPAY_WEBHOOK_BYTES);

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
    const auditPayload = paymentEventAuditPayload(payload);

    if (payload.event === "payment.captured" && payment?.order_id && payment.currency === "INR") {
      const result = await captureDonation(payment.order_id, payment.id, payment.amount);
      await prisma.paymentEvent.create({
        data: {
          providerEventId,
          eventType: payload.event,
          donationId: result.donationId,
          payload: auditPayload,
        },
      });
    } else if (payload.event === "payment.failed" && payment?.order_id && payment.currency === "INR") {
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
            payload: auditPayload,
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
      refund.currency === "INR" &&
      Number.isSafeInteger(refund.amount) &&
      refund.amount > 0
    ) {
      await ensureCapturedDonationForRefund(refund.payment_id);

      await withSerializableTransactionRetry(async tx => {
        const donation = await tx.donation.findUnique({
          where: { providerPaymentId: refund.payment_id },
          select: {
            id: true,
            appealId: true,
            amount: true,
            refundedAmount: true,
            donorEmail: true,
            referenceNumber: true,
          },
        });

        await tx.paymentEvent.create({
          data: {
            providerEventId: providerEventId!,
            eventType: payload.event,
            donationId: donation?.id,
            payload: auditPayload,
          },
        });

        if (!donation) return;

        const appeal = await tx.appeal.findUnique({
          where: { id: donation.appealId },
          select: { status: true, amountRaised: true, goalAmount: true, closesAt: true },
        });
        if (!appeal) {
          throw new Error("Refund donation is missing its appeal");
        }

        const accounting = calculateRefundAccounting({
          donationAmountPaise: decimalRupeesToPaise(donation.amount),
          refundedAmountPaise: decimalRupeesToPaise(donation.refundedAmount),
          appealRaisedPaise: decimalRupeesToPaise(appeal.amountRaised),
          requestedRefundPaise: refund.amount,
        });

        if (accounting.donationRefundPaise > 0) {
          await tx.donation.update({
            where: { id: donation.id },
            data: {
              refundedAmount: { increment: accounting.donationRefundPaise / 100 },
              ...(accounting.fullyRefunded
                ? { status: "REFUNDED" as const, refundedAt: new Date() }
                : {}),
            },
          });
        }

        if (accounting.appealRefundPaise > 0) {
          const nextAmountRaised = accounting.nextAppealRaisedPaise / 100;
          const nextStatus = appealStatusAfterRefund(
            appeal.status,
            nextAmountRaised,
            appeal.goalAmount,
            appeal.closesAt,
          );

          await tx.appeal.update({
            where: { id: donation.appealId },
            data: {
              amountRaised: { decrement: accounting.appealRefundPaise / 100 },
              ...(nextStatus !== appeal.status ? { status: nextStatus as "PUBLISHED" | "CLOSED" } : {}),
            },
          });
        }

        if (accounting.donationRefundPaise > 0) {
          const refundAmount = accounting.donationRefundPaise / 100;
          await tx.notification.create({
            data: {
              channel: "EMAIL",
              recipient: donation.donorEmail,
              templateKey: "donation-refund-processed",
              subject: "Amaana Foundation donation refund processed",
              payload: {
                referenceNumber: donation.referenceNumber,
                refundAmount: `₹${refundAmount.toLocaleString("en-IN")}`,
                refundState: accounting.fullyRefunded ? "full refund" : "partial refund",
              },
              donationId: donation.id,
            },
          });
        }
      });
    } else {
      await prisma.paymentEvent.create({
        data: {
          providerEventId,
          eventType: payload.event,
          payload: auditPayload,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return new NextResponse("Webhook payload too large", { status: 413 });
    }

    if (providerEventId && isPrismaUniqueConstraintError(error)) {
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
