import { timingSafeEqual } from "node:crypto";
import { notFound } from "next/navigation";
import { hashReceiptToken } from "@/lib/donations";
import { formatINR } from "@/lib/appeals";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";

type Props = { params: Promise<{ reference: string }>; searchParams: Promise<{ token?: string }> };
export const dynamic = "force-dynamic";
export default async function AcknowledgementPage({ params, searchParams }: Props) {
  const { reference } = await params; const { token = "" } = await searchParams;
  const donation = await prisma.donation.findUnique({ where: { referenceNumber: reference }, include: { appeal: { select: { title: true } } } });
  const supplied = Buffer.from(hashReceiptToken(token)); const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64));
  if (!donation || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) notFound();
  return <section className="section"><div className="container"><article className="card acknowledgement"><p className="eyebrow">Donation acknowledgement</p><h1>{donation.status === "CAPTURED" ? "JazakAllahu Khairan for your generosity." : "Your payment is being verified."}</h1><p className="lead">{donation.status === "CAPTURED" ? "Amaana Foundation gratefully acknowledges your contribution." : "Please retain this page and your Razorpay payment confirmation."}</p><dl className="receipt-details"><div><dt>Acknowledgement number</dt><dd>{donation.receiptNumber ?? "Pending"}</dd></div><div><dt>Donation reference</dt><dd>{donation.referenceNumber}</dd></div><div><dt>Donor</dt><dd>{donation.donorName}</dd></div><div><dt>Appeal</dt><dd>{donation.appeal.title}</dd></div><div><dt>Amount</dt><dd>{formatINR(donation.amount.toNumber())}</dd></div><div><dt>Status</dt><dd>{donation.status}</dd></div><div><dt>Date</dt><dd>{(donation.capturedAt ?? donation.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</dd></div><div><dt>Payment ID</dt><dd>{donation.providerPaymentId ?? "Pending"}</dd></div></dl><div className="receipt-disclaimer"><strong>Important:</strong> This is a normal donation acknowledgement and does not claim or certify eligibility for deduction under Section 80G.</div><PrintButton /></article></div></section>;
}
