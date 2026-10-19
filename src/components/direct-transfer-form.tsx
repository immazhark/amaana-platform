"use client";

import { getUpiPaymentUri, updateDonationAmountValidity } from "@/lib/donation-amount-input";
import { donationEvidenceUploadIssue } from "@/lib/donation-evidence-header";

import Image from "next/image";
import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import type { DonationFormCopy } from "@/components/donation-form-copy";

type Method = "DIRECT_UPI" | "BANK_TRANSFER";

export function DirectTransferForm({ appealId, maxAmount, method, paymentDetails, onLockChange, copy }: { appealId: string; maxAmount: number; method: Method; paymentDetails: DonationPaymentDetails; onLockChange: (locked: boolean) => void; copy: DonationFormCopy["direct"] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<{ method: Method; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [upiAmount, setUpiAmount] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const submissionRef = useRef(false);
  const transactionMax = Math.min(maxAmount, 1_000_000);
  const transactionMin = transactionMax < 10 ? transactionMax : 10;
  const bankUnavailable = method === "BANK_TRANSFER" && !paymentDetails.bank;
  const upiUri = getUpiPaymentUri(paymentDetails.upi.id, upiAmount, transactionMin, transactionMax);

  async function copyPaymentDetail(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback({ method, text: `${label} copied.` });
    } catch {
      // Clipboard access can be unavailable or explicitly denied. Keep the
      // donor on the verified payment details and offer an actionable fallback.
      setCopyFeedback({ method, text: `Could not copy ${label}. Select the value above and copy it manually.` });
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionRef.current) return;
    submissionRef.current = true;
    onLockChange(true);
    setError(""); setBusy(true);
    let posted = false;
    try {
      const values = new FormData(event.currentTarget);
      const evidence = values.get("evidence");
      const evidenceIssue = donationEvidenceUploadIssue(evidence instanceof File ? evidence : null);
      if (evidenceIssue) throw new Error(evidenceIssue);
      const localTransferredAt = String(values.get("transferredAt") ?? "").trim();
      if (localTransferredAt) {
        const transferredAt = new Date(localTransferredAt);
        if (Number.isNaN(transferredAt.getTime())) throw new Error("Please enter a valid transfer date and time.");
        values.set("transferredAt", transferredAt.toISOString());
      }
      values.set("appealId", appealId); values.set("paymentMethod", method);
      values.set("isAnonymous", values.get("isAnonymous") === "on" ? "true" : "false");
      values.set("domesticConfirmed", values.get("domesticConfirmed") === "on" ? "true" : "false");
      posted = true;
      const response = await fetch("/api/donations/direct-transfer", { method: "POST", body: values });
      const raw: unknown = await response.json();
      const result = raw && typeof raw === "object" && !Array.isArray(raw)
        ? raw as Record<string, unknown> : {};
      if (!response.ok && [400, 403, 413, 429].includes(response.status) &&
          typeof result.error === "string" && result.error.trim()) {
        setError(result.error.trim().slice(0, 500));
        setBusy(false);
        submissionRef.current = false;
        onLockChange(false);
        return;
      }
      if (response.status !== 202 || !response.ok ||
          result.status !== "PENDING_VERIFICATION" ||
          typeof result.referenceNumber !== "string" || !/^AFD-[A-Za-z0-9-]{4,80}$/.test(result.referenceNumber) ||
          typeof result.receiptToken !== "string" || !/^[A-Za-z0-9_-]{20,300}$/.test(result.receiptToken)) {
        throw new Error("uncertain");
      }
      router.push(privateDonationAcknowledgementPath(result.referenceNumber, result.receiptToken));
    } catch (caught) {
      if (posted) {
        setUncertain(true);
        setError("Transfer reporting status is uncertain. Your reference may have been recorded. Do not submit the same UTR again; contact Amaana for reconciliation.");
      } else {
        submissionRef.current = false;
        onLockChange(false);
        setError(caught instanceof Error ? caught.message : "Please check the transfer details.");
      }
      setBusy(false);
    }
  }

  const locked = busy || uncertain || bankUnavailable;
  return <div className="v2-premium-form v2-donation-form">
    {method === "DIRECT_UPI" ? copy.upiHeading : copy.bankHeading}
    {method === "DIRECT_UPI" ? <section className="card" aria-label="Verified UPI details"><p><strong>UPI ID</strong><br/><code>{paymentDetails.upi.id}</code></p><p><button type="button" className="v2-text-link" onClick={() => copyPaymentDetail(paymentDetails.upi.id, "UPI ID")}>Copy UPI ID</button> · {upiUri ? <a className="v2-text-link" href={upiUri}>Open UPI app with ₹{Number(upiAmount).toLocaleString("en-IN")}</a> : <span className="muted">Enter the donation amount below to open your UPI app.</span>}</p>{paymentDetails.upi.qrImageUrl ? <Image src={paymentDetails.upi.qrImageUrl} alt="Amaana Foundation verified UPI payment QR code" width={240} height={240} priority={false}/> : copy.qrMissing}</section> : paymentDetails.bank ? <section className="card" aria-label="Verified bank transfer details"><dl className="details"><div><dt>Account name</dt><dd>{paymentDetails.bank.accountName}</dd></div><div><dt>Account number</dt><dd>{paymentDetails.bank.accountNumber} <button type="button" className="v2-text-link" onClick={() => copyPaymentDetail(paymentDetails.bank!.accountNumber, "Account number")} aria-label="Copy account number">Copy</button></dd></div><div><dt>IFSC</dt><dd>{paymentDetails.bank.ifsc} <button type="button" className="v2-text-link" onClick={() => copyPaymentDetail(paymentDetails.bank!.ifsc, "IFSC")} aria-label="Copy IFSC">Copy</button></dd></div><div><dt>Bank</dt><dd>{paymentDetails.bank.bankName}</dd></div><div><dt>Branch</dt><dd>{paymentDetails.bank.branch}</dd></div></dl></section> : copy.bankMissing}
    <p id={`direct-copy-status-${method}`} role="status" aria-live="polite" aria-atomic="true" className="muted">
      {copyFeedback?.method === method ? copyFeedback.text : ""}
    </p>
    <form onSubmit={submit} className="form-grid" aria-busy={busy}>
      {error && <div className="form-error field full" role="alert">{error}</div>}
      <div className="field"><label htmlFor={`direct-name-${method}`}>Full name</label><input id={`direct-name-${method}`} name="donorName" autoComplete="name" minLength={2} required disabled={locked}/></div>
      <div className="field"><label htmlFor={`direct-email-${method}`}>Email</label><input id={`direct-email-${method}`} name="donorEmail" type="email" autoComplete="email" required disabled={locked}/></div>
      <div className="field"><label htmlFor={`direct-phone-${method}`}>Phone <span className="muted">optional</span></label><input id={`direct-phone-${method}`} name="donorPhone" type="tel" autoComplete="tel" disabled={locked}/></div>
      <div className="field"><label htmlFor={`direct-amount-${method}`}>Amount (INR)</label><input id={`direct-amount-${method}`} name="amount" type="text" inputMode="numeric" pattern="[0-9]+" maxLength={12} onInput={event => { updateDonationAmountValidity(event.currentTarget, transactionMin, transactionMax); if (method === "DIRECT_UPI") setUpiAmount(event.currentTarget.value); }} required aria-describedby={`direct-amount-hint-${method}`} disabled={locked}/><small id={`direct-amount-hint-${method}`}>Whole rupees only. {transactionMax < 10 ? `Enter exactly ₹${transactionMax.toLocaleString("en-IN")}.` : `₹${transactionMin.toLocaleString("en-IN")} to ₹${transactionMax.toLocaleString("en-IN")}.`}</small></div>
      <div className="field"><label htmlFor={`direct-reference-${method}`}>UTR / transaction reference</label><input id={`direct-reference-${method}`} name="transferReference" minLength={6} maxLength={100} required disabled={locked}/></div>
      <div className="field"><label htmlFor={`direct-date-${method}`}>Transfer date and time</label><input id={`direct-date-${method}`} name="transferredAt" type="datetime-local" required disabled={locked}/></div>
      <div className="field full"><label htmlFor={`direct-evidence-${method}`}>Screenshot / receipt <span className="muted">optional, max 5 MB</span></label><input id={`direct-evidence-${method}`} name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={locked}/><small>Supporting evidence only. It does not prove receipt until an Amaana administrator verifies the transfer.</small></div>
      <fieldset className="field full" disabled={locked}><legend>Giving intention</legend>{copy.intentOptions}</fieldset>
      <div className="field full"><label className="checkbox"><input name="isAnonymous" type="checkbox" disabled={locked}/>{copy.privacy}</label></div>
      <div className="field full"><label className="checkbox"><input name="domesticConfirmed" type="checkbox" required disabled={locked}/>{copy.domestic}</label></div>
      <div className="field full"><button className="v2-button" type="submit" disabled={locked}>{uncertain ? "Verification follow-up required" : busy ? "Submitting for verification…" : "Submit transfer for verification"}</button>{copy.next}</div>
    </form>
  </div>;
}
