"use client";

import Link from "@/components/navigation-link";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { PrintButton } from "@/components/print-button";
import { donationIntentLabel } from "@/lib/donation-intent";
import { formatPrivateReceiptINR, parsePrivateDonationAcknowledgementLocation } from "@/lib/private-donation-ack";
import { isAcknowledgementResponse, type AcknowledgementRecord } from "@/lib/private-record-response";
const ReceiptPdfDownloadButton = lazy(() => import("@/components/receipt-pdf-download-button"));


function PrivateTokenRecovery({ onRecover }: { onRecover: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [invalid, setInvalid] = useState(false);
  return <form className="v2-premium-form" onSubmit={event => {
    event.preventDefault();
    const candidate = token.trim();
    if (candidate.length < 20 || candidate.length > 300) { setInvalid(true); return; }
    setInvalid(false);
    setToken("");
    onRecover(candidate);
  }}>
    <div className="field">
      <label htmlFor="private-acknowledgement-token">Have your private record token?</label>
      <input id="private-acknowledgement-token" type="password" autoComplete="off"
        autoCapitalize="off" spellCheck={false} minLength={20} maxLength={300} required
        aria-describedby="private-acknowledgement-token-help"
        aria-invalid={invalid} value={token} onChange={event => {
          setToken(event.target.value); setInvalid(false);
        }} />
      <p id="private-acknowledgement-token-help">Enter the token provided with your original acknowledgement. It is checked privately and is never added to the page URL.</p>
      {invalid && <p role="alert">Enter a valid private token of 20 to 300 characters.</p>}
    </div>
    <button className="v2-button" type="submit">Open private record</button>
  </form>;
}

export function DonationAcknowledgementClient({ reference, pdfEnabled = false }: { reference: string; pdfEnabled?: boolean }) {
  const [record, setRecord] = useState<AcknowledgementRecord | null | "error" | undefined>(undefined);
  const [attempt, retry] = useState(0);
  const credential = useRef<[string, string | null]>([reference, null]);

  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    const frame = window.requestAnimationFrame(() => {
      setRecord(undefined);
      const resolvedToken = parsePrivateDonationAcknowledgementLocation(window.location.search, window.location.hash)
        ?? (credential.current[0] === reference ? credential.current[1] : null);
      credential.current = [reference, resolvedToken];
      if (window.location.search || window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      if (!resolvedToken) {
        setRecord(null);
        return;
      }

      controller = new AbortController();
      void fetch("/api/donations/acknowledgement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, token: resolvedToken }),
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async response => {
          if (response.status >= 500 || response.status === 429) throw new Error();
          const result: unknown = response.ok ? await response.json() : { found: false };
          if (!isAcknowledgementResponse(result, reference)) throw new Error("Invalid acknowledgement response");
          return result;
        })
        .then(result => { if (active) setRecord(result.found ? result : null); })
        .catch(error => {
          if (active && error?.name !== "AbortError") setRecord("error");
        });
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      controller?.abort();
    };
  }, [reference, attempt]);

  if (record === undefined) {
    return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>Opening your private transaction record…</h1><p>Checking your private record.</p></div></section></div>;
  }

  if (!record || record === "error") {
    const failed = record === "error";
    const recover = (token: string) => {
      credential.current = [reference, token];
      setRecord(undefined);
      retry(value => value + 1);
    };
    return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>{failed ? "Unable to open your acknowledgement." : "Private acknowledgement unavailable."}</h1><p>{failed ? "Service temporarily unavailable. Retry without paying again." : "This link is incomplete, invalid or unavailable."} Your record stays private and requires a valid token.</p>{!failed && <PrivateTokenRecovery onRecover={recover} />}<div className="v2-hero-actions">{failed ? <button className="v2-button" type="button" onClick={() => { setRecord(undefined); retry(value => value + 1); }}>Try again</button> : <Link className="v2-button" href="/appeals">View verified needs</Link>}<Link className="v2-text-link" href="/contact">Contact Amaana →</Link></div></div></section></div>;
  }

  const { donation, presentation } = record;
  return <div className="v2-home v2-receipt-page"><section className="v2-receipt-hero"><div className="v2-shell"><p className="v2-section-label">Donation acknowledgement</p><h1>{presentation.heading}</h1><p>{presentation.summary}</p><div className={`v2-receipt-status ${presentation.tone}`}><span>{presentation.statusLabel}</span><strong>{formatPrivateReceiptINR(donation.amount)}</strong><small>{donation.appeal.title}</small></div></div></section><section className="v2-section paper"><div className="v2-shell v2-receipt-layout"><article className="v2-receipt-sheet"><div className="v2-receipt-sheet-head"><div><span>Amaana Foundation</span><h2>Private transaction record</h2></div><strong>{donation.receiptNumber ?? "Pending"}</strong></div><dl><div><dt>Donation reference</dt><dd>{donation.referenceNumber}</dd></div><div><dt>Donor</dt><dd>{donation.donorName}</dd></div><div><dt>{donation.designationKind === "FUND" ? "Giving fund" : "Appeal"}</dt><dd>{donation.appeal.title}</dd></div><div><dt>Giving intention</dt><dd>{donationIntentLabel(donation.givingIntent)}</dd></div><div><dt>Original amount</dt><dd>{formatPrivateReceiptINR(donation.amount)}</dd></div>{donation.refundedAmount > 0 && <div><dt>Refunded amount</dt><dd>{formatPrivateReceiptINR(donation.refundedAmount)}</dd></div>}<div><dt>Status</dt><dd>{presentation.statusLabel}</dd></div><div><dt>Record date</dt><dd>{new Date(donation.recordDate).toLocaleDateString("en-IN", { dateStyle: "long" })}</dd></div><div><dt>Payment ID</dt><dd>{donation.providerPaymentId ?? (presentation.tone === "pending" ? "Pending verification" : "Not applicable")}</dd></div></dl><div className="v2-receipt-disclaimer"><strong>Important</strong><p>Private transaction acknowledgement; this does not certify Section 80G deduction eligibility.</p></div><PrintButton />{pdfEnabled && donation.receiptNumber && ["captured", "refunded"].includes(presentation.tone) && <Suspense fallback={null}>
  <ReceiptPdfDownloadButton reference={reference}
    getToken={() => credential.current[0] === reference ? credential.current[1] : null} />
</Suspense>}</article><aside className="v2-receipt-next"><p className="v2-section-label">Continue with context</p><h2>Keep this record private.</h2><p>Explore the work. For payment discrepancies, contact Amaana with your confirmation. Never share OTPs, UPI PINs or card credentials.</p><div className="v2-receipt-links">{donation.appeal.slug && <Link href={`/appeals/${donation.appeal.slug}`}>Return to this appeal <span>↗</span></Link>}<Link href="/impact">Explore documented impact <span>↗</span></Link><Link href="/transparency">See our transparency approach <span>↗</span></Link></div></aside></div></section></div>;
}
