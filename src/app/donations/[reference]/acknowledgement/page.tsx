import type { Metadata } from "next";
import Link from "next/link";
import { timingSafeEqual } from "node:crypto";
import { notFound } from "next/navigation";
import { getDonationAcknowledgementPresentation, hashReceiptToken } from "@/lib/donations";
import { formatINR } from "@/lib/appeals";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = {
  title: "Private Donation Acknowledgement",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ reference: string }>; searchParams: Promise<{ token?: string }> };
export const dynamic = "force-dynamic";

export default async function AcknowledgementPage({ params, searchParams }: Props) {
  const { reference } = await params;
  const { token = "" } = await searchParams;
  const donation = await prisma.donation.findUnique({
    where: { referenceNumber: reference },
    select: {
      receiptTokenHash: true,
      status: true,
      amount: true,
      refundedAmount: true,
      receiptNumber: true,
      referenceNumber: true,
      donorName: true,
      capturedAt: true,
      refundedAt: true,
      createdAt: true,
      providerPaymentId: true,
      appeal: { select: { title: true, slug: true } },
    },
  });
  const supplied = Buffer.from(hashReceiptToken(token));
  const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64));
  if (!donation || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) notFound();

  const amount = donation.amount.toNumber();
  const refundedAmount = donation.refundedAmount.toNumber();
  const presentation = getDonationAcknowledgementPresentation(donation.status, amount, refundedAmount);
  const recordDate = donation.refundedAt ?? donation.capturedAt ?? donation.createdAt;

  return <div className="v2-home v2-receipt-page"><section className="v2-receipt-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>{presentation.heading}</h1><p>{presentation.summary}</p><div className={`v2-receipt-status ${presentation.tone}`}><span>{presentation.statusLabel}</span><strong>{formatINR(amount)}</strong><small>{donation.appeal.title}</small></div></div></section><section className="v2-section paper"><div className="v2-shell v2-receipt-layout"><article className="v2-receipt-sheet"><div className="v2-receipt-sheet-head"><div><span>Amaana Foundation</span><h2>Private transaction record</h2></div><strong>{donation.receiptNumber ?? "Pending"}</strong></div><dl><div><dt>Donation reference</dt><dd>{donation.referenceNumber}</dd></div><div><dt>Donor</dt><dd>{donation.donorName}</dd></div><div><dt>Appeal</dt><dd>{donation.appeal.title}</dd></div><div><dt>Original amount</dt><dd>{formatINR(amount)}</dd></div>{refundedAmount > 0 && <div><dt>Refunded amount</dt><dd>{formatINR(refundedAmount)}</dd></div>}<div><dt>Status</dt><dd>{presentation.statusLabel}</dd></div><div><dt>Record date</dt><dd>{recordDate.toLocaleDateString("en-IN", { dateStyle: "long" })}</dd></div><div><dt>Payment ID</dt><dd>{donation.providerPaymentId ?? "Not available"}</dd></div></dl><div className="v2-receipt-disclaimer"><strong>Important</strong><p>This is a private transaction acknowledgement and does not claim or certify eligibility for deduction under Section 80G.</p></div><PrintButton /></article><aside className="v2-receipt-next"><p className="v2-section-label">Continue with context</p><h2>Keep this record private.</h2><p>You can return to the appeal, explore documented work, or review Amaana&apos;s transparency approach. If the payment status shown here does not match your Razorpay or bank record, contact Amaana and keep your payment confirmation; never share an OTP, UPI PIN or card credentials.</p><div className="v2-receipt-links"><Link href={`/appeals/${donation.appeal.slug}`}>Return to this appeal <span>↗</span></Link><Link href="/impact">Explore documented impact <span>↗</span></Link><Link href="/transparency">See our transparency approach <span>↗</span></Link></div></aside></div></section></div>;
}
