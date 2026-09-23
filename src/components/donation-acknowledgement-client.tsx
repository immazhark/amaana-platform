"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PrintButton } from "@/components/print-button";
import { donationIntentLabel } from "@/lib/donation-intent";
import { parsePrivateDonationAcknowledgementLocation } from "@/lib/private-donation-ack";

type AcknowledgementRecord = {
  found: true;
  presentation: {
    tone: "captured" | "pending" | "failed" | "refunded";
    heading: string;
    summary: string;
    statusLabel: string;
  };
  donation: {
    referenceNumber: string;
    receiptNumber: string | null;
    donorName: string;
    givingIntent: string;
    amount: number;
    refundedAmount: number;
    recordDate: string;
    providerPaymentId: string | null;
    appeal: { title: string; slug: string };
  };
};

type AcknowledgementResponse = AcknowledgementRecord | { found: false };
const formatINR = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export function DonationAcknowledgementClient({ reference }: { reference: string }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [record, setRecord] = useState<AcknowledgementRecord | null | undefined>(undefined);

  useEffect(() => {
    const resolvedToken = parsePrivateDonationAcknowledgementLocation(window.location.search, window.location.hash);
    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    setToken(resolvedToken);
    if (!resolvedToken) {
      setRecord(null);
      return;
    }

    setRecord(undefined);
    const controller = new AbortController();
    void fetch("/api/donations/acknowledgement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, token: resolvedToken }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async response => response.ok ? await response.json() as AcknowledgementResponse : { found: false } as AcknowledgementResponse)
      .then(result => setRecord(result.found ? result : null))
      .catch(error => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setRecord(null);
      });

    return () => controller.abort();
  }, [reference]);

  const loading = token === undefined || (Boolean(token) && record === undefined);

  if (loading) {
    return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>Opening your private transaction record…</h1><p>Confirming the private acknowledgement details in this browser.</p></div></section></div>;
  }

  if (!record) {
    return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>Private acknowledgement unavailable.</h1><p>This link is incomplete, invalid or no longer available. For privacy, no donor or transaction details are shown without the valid private token.</p><div className="v2-hero-actions"><Link className="v2-button" href="/appeals">View verified needs</Link><Link className="v2-text-link" href="/contact">Contact Amaana →</Link></div></div></section></div>;
  }

  const { donation, presentation } = record;
  return <div className="v2-home v2-receipt-page"><section className="v2-receipt-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>{presentation.heading}</h1><p>{presentation.summary}</p><div className={`v2-receipt-status ${presentation.tone}`}><span>{presentation.statusLabel}</span><strong>{formatINR(donation.amount)}</strong><small>{donation.appeal.title}</small></div></div></section><section className="v2-section paper"><div className="v2-shell v2-receipt-layout"><article className="v2-receipt-sheet"><div className="v2-receipt-sheet-head"><div><span>Amaana Foundation</span><h2>Private transaction record</h2></div><strong>{donation.receiptNumber ?? "Pending"}</strong></div><dl><div><dt>Donation reference</dt><dd>{donation.referenceNumber}</dd></div><div><dt>Donor</dt><dd>{donation.donorName}</dd></div><div><dt>Appeal</dt><dd>{donation.appeal.title}</dd></div><div><dt>Giving intention</dt><dd>{donationIntentLabel(donation.givingIntent)}</dd></div><div><dt>Original amount</dt><dd>{formatINR(donation.amount)}</dd></div>{donation.refundedAmount > 0 && <div><dt>Refunded amount</dt><dd>{formatINR(donation.refundedAmount)}</dd></div>}<div><dt>Status</dt><dd>{presentation.statusLabel}</dd></div><div><dt>Record date</dt><dd>{new Date(donation.recordDate).toLocaleDateString("en-IN", { dateStyle: "long" })}</dd></div><div><dt>Payment ID</dt><dd>{donation.providerPaymentId ?? "Not available"}</dd></div></dl><div className="v2-receipt-disclaimer"><strong>Important</strong><p>This is a private transaction acknowledgement and does not claim or certify eligibility for deduction under Section 80G.</p></div><PrintButton /></article><aside className="v2-receipt-next"><p className="v2-section-label">Continue with context</p><h2>Keep this record private.</h2><p>You can return to the appeal, explore documented work, or review Amaana&apos;s transparency approach. If the payment status shown here does not match your Razorpay or bank record, contact Amaana and keep your payment confirmation; never share an OTP, UPI PIN or card credentials.</p><div className="v2-receipt-links"><Link href={`/appeals/${donation.appeal.slug}`}>Return to this appeal <span>↗</span></Link><Link href="/impact">Explore documented impact <span>↗</span></Link><Link href="/transparency">See our transparency approach <span>↗</span></Link></div></aside></div></section></div>;
}
