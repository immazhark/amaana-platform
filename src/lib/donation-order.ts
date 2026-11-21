import { randomUUID } from "node:crypto";
import { createDonationReference, createReceiptToken, hashReceiptToken } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { calculateFeeCover } from "@/lib/processing-fee";
import { createRazorpayOrder } from "@/lib/razorpay";
import { sponsorshipColumns, type SponsorshipRecord } from "@/lib/taleem-sponsorship";

// Exactly one destination: an appeal or a fund. Mirrors the database CHECK on Donation.
export type OrderDestination =
  | { appealId: string; fundId?: undefined; fundSlug?: undefined; title: string; donorDirective?: undefined; campaignId?: undefined; units?: undefined; unitPrice?: undefined; sponsorship?: undefined }
  | { fundId: string; fundSlug: string; appealId?: undefined; title: string; donorDirective: string | null; campaignId?: string; units?: number; unitPrice?: number; sponsorship?: SponsorshipRecord };

export type OrderInput = {
  donorName: string;
  donorEmail: string;
  donorPhone?: string | undefined;
  amount: number;
  givingIntent: string;
  isAnonymous: boolean;
  coverProcessingFee: boolean;
  destination: OrderDestination;
};

// Creates the provider order and the local donation record. `onProviderAttempt` runs immediately before the
// provider request, because from that point a transport error cannot prove no order exists.
export async function placeRazorpayDonationOrder(input: OrderInput, onProviderAttempt: () => void) {
  const { destination } = input;
  const referenceNumber = createDonationReference();
  const receiptToken = createReceiptToken();
  const donationPaise = input.amount * 100;
  if (!Number.isSafeInteger(donationPaise) || donationPaise <= 0) throw new Error("Donation amount cannot be represented safely in paise");
  // The server alone decides the fee cover; the amount charged is the chosen donation plus that fee.
  const feePaise = input.coverProcessingFee ? calculateFeeCover(donationPaise).feePaise : 0;
  const amountPaise = donationPaise + feePaise;
  onProviderAttempt();
  const order = await createRazorpayOrder({
    amountPaise,
    receipt: referenceNumber,
    givingIntent: input.givingIntent,
    ...(destination.appealId ? { appealId: destination.appealId } : { fundSlug: destination.fundSlug }),
  });
  // Never persist a fabricated or unusable provider identity or a non-created order.
  if (
    typeof order.id !== "string" ||
    !/^order_[A-Za-z0-9]+$/.test(order.id) ||
    order.amount !== amountPaise ||
    order.currency !== "INR" ||
    order.receipt !== referenceNumber ||
    order.status !== "created"
  ) {
    throw new Error("Unexpected order response");
  }
  const donationId = randomUUID();
  let donation;
  try {
    donation = await prisma.donation.create({
      data: {
        id: donationId,
        referenceNumber,
        ...(destination.appealId ? { appealId: destination.appealId } : { fundId: destination.fundId, donorDirective: destination.donorDirective }),
        ...(destination.campaignId ? { campaignId: destination.campaignId, units: destination.units, unitPrice: destination.unitPrice } : {}),
        ...(destination.sponsorship ? sponsorshipColumns(destination.sponsorship) : {}),
        donorName: input.donorName,
        donorEmail: input.donorEmail.toLowerCase(),
        donorPhone: input.donorPhone || null,
        isAnonymous: input.isAnonymous,
        givingIntent: input.givingIntent as "GENERAL" | "SADAQAH" | "ZAKAT",
        domesticConfirmedAt: new Date(),
        amount: input.amount,
        feeContributionAmount: feePaise / 100,
        paymentMethod: "RAZORPAY",
        provider: "RAZORPAY",
        providerOrderId: order.id,
        receiptTokenHash: hashReceiptToken(receiptToken),
      },
      select: { id: true, donorName: true, donorEmail: true, donorPhone: true },
    });
  } catch (error) {
    // The provider order has already been created. Recover this request's committed record without issuing
    // another external order or exposing credentials for a different donation.
    const recovered = await prisma.donation.findUnique({
      where: { id: donationId },
      select: { id: true, donorName: true, donorEmail: true, donorPhone: true, providerOrderId: true, receiptTokenHash: true },
    });
    if (!recovered || recovered.providerOrderId !== order.id || recovered.receiptTokenHash !== hashReceiptToken(receiptToken)) throw error;
    donation = recovered;
  }
  return {
    donationId: donation.id,
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    appealTitle: destination.title,
    donor: { name: donation.donorName, email: donation.donorEmail, contact: donation.donorPhone },
    receiptToken,
  };
}
