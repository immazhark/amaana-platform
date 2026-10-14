import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { appealStatusAfterRefund } from "@/lib/appeals";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { paymentEventAuditPayload } from "@/lib/payment-event-audit";
import { captureDonation, ensureCapturedDonationForRefund } from "@/lib/payment-processing";
import { requireDonationDestination } from "@/lib/donation-destination";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { calculateRefundAccounting } from "@/lib/refund-accounting";
import { validateProductionEnvironment } from "@/lib/env";
import { isMatchingPaymentEventReplay, isPrismaUniqueConstraintError } from "@/lib/webhook-idempotency";
import { logServerError } from "@/lib/server-log";

const MAX_RAZORPAY_WEBHOOK_BYTES = 256 * 1024;

type RazorpayEntity = {
  id: string;
  order_id?: string;
  payment_id?: string;
  amount: number;
  currency?: string;
  status?: string;
  captured?: boolean;
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
  let receivedEventType: string | null = null;
  let receivedAuditPayload: ReturnType<typeof paymentEventAuditPayload> | null = null;

  try {
    validateProductionEnvironment();
    const rawBody = await readTextBodyWithLimit(request, MAX_RAZORPAY_WEBHOOK_BYTES);

    if (!verifyWebhookSignature(rawBody, signature)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as RazorpayWebhook;
    receivedEventType = payload.event;
    const auditPayload = paymentEventAuditPayload(payload);
    receivedAuditPayload = auditPayload;
    providerEventId =
      request.headers.get("x-razorpay-event-id")?.trim() ||
      createHash("sha256").update(rawBody).digest("hex");

    const alreadyProcessed = await prisma.paymentEvent.findUnique({
      where: { providerEventId },
      select: { id: true, eventType: true, payload: true },
    });
    if (alreadyProcessed) {
      if (!isMatchingPaymentEventReplay(alreadyProcessed, payload.event, auditPayload)) {
        logServerError("razorpay.webhook_event_id_collision", {
          hasProviderEventId: true,
          storedEventType: alreadyProcessed.eventType,
          receivedEventType: payload.event,
        });
        return new NextResponse("Webhook event id conflict", { status: 409 });
      }
      return NextResponse.json({ received: true });
    }

    const payment = payload.payload?.payment?.entity;
    const refund = payload.payload?.refund?.entity;

    // A financial refund must have a stable provider identity. Never acknowledge
    // malformed refunds as processed, since doing so would hide reconciliation.
    if (payload.event === "refund.processed" && (
      !refund || typeof refund.id !== "string" || !/^rfnd_[A-Za-z0-9]+$/.test(refund.id) ||
      typeof refund.payment_id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(refund.payment_id) ||
      refund.currency !== "INR" ||
      (refund.status !== undefined && refund.status !== "processed") ||
      !Number.isSafeInteger(refund.amount) || refund.amount <= 0
    )) {
      return new NextResponse("Invalid refund entity", { status: 400 });
    }

    // A signed webhook can still carry malformed provider data. Never acknowledge
    // a capture event without a valid identity, currency and positive paise amount.
    if (payload.event === "payment.captured" && (
      !payment ||
      typeof payment.id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(payment.id) ||
      typeof payment.order_id !== "string" || !/^order_[A-Za-z0-9]+$/.test(payment.order_id) ||
      payment.currency !== "INR" ||
      (payment.status !== undefined && payment.status !== "captured") ||
      payment.captured === false ||
      !Number.isSafeInteger(payment.amount) || payment.amount <= 0
    )) {
      return new NextResponse("Invalid captured payment entity", { status: 400 });
    }

    // Financial failure events must never fall through to the generic 200
    // acknowledgement when the provider identity or amount is malformed.
    if (payload.event === "payment.failed" && (
      !payment ||
      typeof payment.id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(payment.id) ||
      typeof payment.order_id !== "string" || !/^order_[A-Za-z0-9]+$/.test(payment.order_id) ||
      payment.currency !== "INR" ||
      (payment.status !== undefined && payment.status !== "failed") ||
      payment.captured === true ||
      !Number.isSafeInteger(payment.amount) || payment.amount <= 0
    )) {
      return new NextResponse("Invalid payment entity", { status: 400 });
    }

    if (payload.event === "payment.captured" && payment?.order_id && payment.currency === "INR") {
      const result = await captureDonation(payment.order_id, payment.id, payment.amount);
      try {
        await prisma.paymentEvent.create({
          data: {
            providerEventId,
            eventType: payload.event,
            donationId: result.donationId,
            payload: auditPayload,
          },
        });
      } catch (eventError) {
        if (!isPrismaUniqueConstraintError(eventError)) throw eventError;
        const existing = await prisma.paymentEvent.findUnique({
          where: { providerEventId },
          select: { id: true, eventType: true, payload: true },
        });
        if (!isMatchingPaymentEventReplay(existing, payload.event, auditPayload)) throw eventError;
      }
    } else if (
      payload.event === "payment.failed" &&
      payment?.order_id &&
      payment.currency === "INR" &&
      Number.isSafeInteger(payment.amount) &&
      payment.amount > 0
    ) {
      await withSerializableTransactionRetry(async tx => {
        const donation = await tx.donation.findUnique({
          where: { providerOrderId: payment.order_id },
          select: { id: true, amount: true },
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
          const expectedAmountPaise = decimalRupeesToPaise(donation.amount);
          if (payment.amount !== expectedAmountPaise) {
            throw new Error("Failed payment amount does not match the local donation order");
          }
          await tx.donation.updateMany({
            where: {
              id: donation.id,
              OR: [
                { status: "CREATED" },
                { status: "AUTHORIZED", providerPaymentId: payment.id },
              ],
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
            fundId: true,
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

        if (!donation) throw new Error("Refund donation is not available for reconciliation");
        const destination = requireDonationDestination(donation);

        // The entity claim and ALL financial effects share the transaction.
        // skipDuplicates avoids swallowing a different uniqueness failure.
        // Serializable conflicts retry the complete operation using fresh state.
        const claim = await tx.refundLedger.createMany({
          data: {
            providerRefundId: refund.id,
            providerPaymentId: refund.payment_id!,
            donationId: donation.id,
            amount: refund.amount / 100,
            currency: refund.currency!,
          },
          skipDuplicates: true,
        });
        if (claim.count === 0) {
          const existingRefund = await tx.refundLedger.findUnique({
            where: { providerRefundId: refund.id },
          });
          if (!existingRefund ||
            existingRefund.donationId !== donation.id ||
            existingRefund.providerPaymentId !== refund.payment_id ||
            existingRefund.currency !== refund.currency ||
            decimalRupeesToPaise(existingRefund.amount) !== refund.amount) {
            throw new Error("Refund entity identity conflict");
          }
          return;
        }

        const appeal = destination.kind === "APPEAL"
          ? await tx.appeal.findUnique({
              where: { id: destination.id },
              select: { status: true, amountRaised: true, goalAmount: true, closesAt: true },
            })
          : null;
        if (destination.kind === "APPEAL" && !appeal) {
          throw new Error("Refund donation is missing its appeal");
        }

        const accounting = calculateRefundAccounting({
          donationAmountPaise: decimalRupeesToPaise(donation.amount),
          refundedAmountPaise: decimalRupeesToPaise(donation.refundedAmount),
          // Fund balances are derived from each donation's settled net amount;
          // no appeal counter exists to decrement for a fund-only refund.
          appealRaisedPaise: appeal
            ? decimalRupeesToPaise(appeal.amountRaised)
            : decimalRupeesToPaise(donation.amount),
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

        if (appeal && accounting.appealRefundPaise > 0) {
          const nextAmountRaised = accounting.nextAppealRaisedPaise / 100;
          const nextStatus = appealStatusAfterRefund(
            appeal.status,
            nextAmountRaised,
            appeal.goalAmount,
            appeal.closesAt,
          );

          await tx.appeal.update({
            where: { id: destination.id },
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
        select: { id: true, eventType: true, payload: true },
      });
      if (existing && receivedEventType && receivedAuditPayload &&
        isMatchingPaymentEventReplay(existing, receivedEventType, receivedAuditPayload)) {
        return NextResponse.json({ received: true });
      }
      if (existing) {
        return new NextResponse("Webhook event id conflict", { status: 409 });
      }
    }

    logServerError("razorpay.webhook_failed", {
      eventType: receivedEventType ?? "unknown",
      hasProviderEventId: Boolean(providerEventId),
    });
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}

