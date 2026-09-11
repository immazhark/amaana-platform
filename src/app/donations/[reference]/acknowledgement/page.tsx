import type { Metadata } from "next";
import Link from "next/link";
import { timingSafeEqual } from "node:crypto";
import { notFound } from "next/navigation";
import { hashReceiptToken } from "@/lib/donations";
import { formatINR } from "@/lib/appeals";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = {
  title: "Private Donation Acknowledgement",
  robots: { index: false, follow: false },
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
      receiptNumber: true,
      referenceNumber: true,
      donorName: true,
      capturedAt: true,
      createdAt: true,
      providerPaymentId: true,
      appeal: { select: { title: true, slug: true } },
    },
  });
  const supplied = Buffer.from(hashReceiptToken(token));
  const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64));
  if (!donation || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) notFound();
  const captured = donation.status === "CAPTURED";

  return <div className="v2-home v2-receipt-page"><section className="v2-receipt-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>{captured ? "JazakAllahu Khairan." : "Your payment is being verified."}</h1><p>{captured ? "Amaana Foundation gratefully acknowledges your contribution and the trust placed in this appeal." : "Please retain this page and your Razorpay payment confirmation while verification completes."}</p><div className={`v2-receipt-status ${captured ? "captured" : "pending"}`}><span>{captured ? "Payment verified" : "Verification pending"}</span><strong>{formatINR(donation.amount.toNumber())}</strong><small>{donation.appeal.title}</small></div></div></section><section className="v2-section paper"><div className="v2-shell v2-receipt-layout"><article className="v2-receipt-sheet"><div className="v2-receipt-sheet-head"><div><span>Amaana Foundation</span><h2>Acknowledgement record</h2></div><strong>{donation.receiptNumber ?? "Pending"}</strong></div><dl><div><dt>Donation reference</dt><dd>{donation.referenceNumber}</dd></div><div><dt>Donor</dt><dd>{donation.donorName}</dd></div><div><dt>Appeal</dt><dd>{donation.appeal.title}</dd></div><div><dt>Amount</dt><dd>{formatINR(donation.amount.toNumber())}</dd></div><div><dt>Status</dt><dd>{donation.status}</dd></div><div><dt>Date</dt><dd>{(donation.capturedAt ?? donation.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</dd></div><div><dt>Payment ID</dt><dd>{donation.providerPaymentId ?? "Pending"}</dd></div></dl><div className="v2-receipt-disclaimer"><strong>Important</strong><p>This is a normal donation acknowledgement and does not claim or certify eligibility for deduction under Section 80G.</p></div><PrintButton /></article><aside className="v2-receipt-next"><p className="v2-section-label">Continue the journey</p><h2>Your support belongs to a wider story.</h2><p>You can return to the appeal, explore the work it sits within, or see how Amaana approaches transparency.</p><div className="v2-receipt-links"><Link href={`/appeals/${donation.appeal.slug}`}>Return to this appeal <span>↗</span></Link><Link href="/impact">Explore documented impact <span>↗</span></Link><Link href="/transparency">See our transparency approach <span>↗</span></Link></div></aside></div></section></div>;
}
