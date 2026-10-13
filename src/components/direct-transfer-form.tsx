"use client";

import { updateDonationAmountValidity } from "@/lib/donation-amount-input";

import Image from "next/image";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { DONATION_INTENT_DESCRIPTIONS, DONATION_INTENT_LABELS, type DonationIntentValue } from "@/lib/donation-intent";
import { classifyDirectTransferResponse, isDirectTransferField, UNCERTAIN_TRANSFER_MESSAGE, type DirectTransferField, type DirectTransferFieldErrors } from "@/lib/direct-transfer-feedback";

type Method = "DIRECT_UPI" | "BANK_TRANSFER";

export function DirectTransferForm({ appealId, maxAmount, zakatEligible, method, paymentDetails, onSubmissionLockChange }: { appealId: string; maxAmount: number; zakatEligible: boolean; method: Method; paymentDetails: DonationPaymentDetails; onSubmissionLockChange?: (locked: boolean) => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<DirectTransferFieldErrors>({});
  const [phase, setPhase] = useState<"ready" | "submitting" | "submitted" | "reconciliation">("ready");
  const [copyStatus, setCopyStatus] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const submissionLocked = useRef(false);
  const focusRequest = useRef(0);
  const focusedRequest = useRef(0);
  const busy = phase === "submitting";
  const locked = phase !== "ready";
  const transactionMax = Math.min(maxAmount, 1_000_000);
  const transactionMin = transactionMax < 10 ? transactionMax : 10;
  const bankUnavailable = method === "BANK_TRANSFER" && !paymentDetails.bank;
  const upiUri = `upi://pay?pa=${encodeURIComponent(paymentDetails.upi.id)}&pn=${encodeURIComponent("AMAANA FOUNDATION")}&cu=INR`;

  useEffect(() => {
    if (!error || busy || focusRequest.current === focusedRequest.current) return;
    const request = focusRequest.current;
    const frame = requestAnimationFrame(() => {
      if (request !== focusRequest.current) return;
      const field = Object.keys(fieldErrors).find(name => isDirectTransferField(name) && fieldErrors[name]?.length);
      const control = phase === "ready" && field ? formRef.current?.elements.namedItem(field) : null;
      if (control instanceof HTMLElement) control.focus();
      else if (control instanceof RadioNodeList) {
        const radios = Array.from(control).filter((item): item is HTMLInputElement => item instanceof HTMLInputElement);
        const target = radios.find(radio => radio.checked) ?? radios[0];
        if (target) target.focus();
        else errorRef.current?.focus();
      } else errorRef.current?.focus();
      focusedRequest.current = request;
    });
    return () => cancelAnimationFrame(frame);
  }, [error, fieldErrors, busy, phase]);

  function showError(message: string, errors: DirectTransferFieldErrors = {}) {
    focusRequest.current++;
    setFieldErrors(errors);
    setError(message);
  }

  function fieldProps(field: DirectTransferField, hint?: string) {
    const message = fieldErrors[field]?.[0];
    return {
      "aria-invalid": Boolean(message) || undefined,
      "aria-describedby": [hint, message ? `direct-${field}-error-${method}` : undefined].filter(Boolean).join(" ") || undefined,
      onChange: () => setFieldErrors(current => current[field] ? { ...current, [field]: undefined } : current),
    };
  }

  function fieldError(field: DirectTransferField) {
    const message = fieldErrors[field]?.[0];
    return message ? <small id={`direct-${field}-error-${method}`} className="v2-field-error">{message}</small> : null;
  }

  function handleInvalid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const control = event.target;
    if (!(control instanceof HTMLInputElement) || !isDirectTransferField(control.name)) return;
    const field = control.name;
    setFieldErrors(current => ({ ...current, [field]: [control.validationMessage || "Please check this field."] }));
    if (formRef.current?.querySelector(":invalid") === control) focusRequest.current++;
    setError("Please check the highlighted transfer information.");
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus(`Could not copy ${label.toLowerCase()}. Select the displayed value and copy it manually.`);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLocked.current || bankUnavailable) return;
    if (!event.currentTarget.reportValidity()) return;
    submissionLocked.current = true;
    onSubmissionLockChange?.(true);
    setError(""); setFieldErrors({}); setPhase("submitting");
    const values = new FormData(event.currentTarget);
    const localTransferredAt = String(values.get("transferredAt") ?? "").trim();
    if (localTransferredAt) {
      const transferredAt = new Date(localTransferredAt);
      if (Number.isNaN(transferredAt.getTime())) {
        submissionLocked.current = false;
        onSubmissionLockChange?.(false);
        setPhase("ready");
        showError("Please enter a valid transfer date and time.", { transferredAt: ["Please enter a valid transfer date and time."] });
        return;
      }
      values.set("transferredAt", transferredAt.toISOString());
    }
    values.set("appealId", appealId); values.set("paymentMethod", method);
    values.set("isAnonymous", values.get("isAnonymous") === "on" ? "true" : "false");
    values.set("domesticConfirmed", values.get("domesticConfirmed") === "on" ? "true" : "false");
    try {
      const response = await fetch("/api/donations/direct-transfer", { method: "POST", body: values });
      const body: unknown = await response.json();
      const result = classifyDirectTransferResponse(response.status, body);
      if (result.kind === "accepted") {
        setPhase("submitted");
        router.push(privateDonationAcknowledgementPath(result.referenceNumber, result.receiptToken));
      } else if (result.kind === "rejected") {
        submissionLocked.current = false;
        onSubmissionLockChange?.(false);
        setPhase("ready");
        showError(result.message, result.fieldErrors);
      } else {
        setPhase("reconciliation");
        showError(UNCERTAIN_TRANSFER_MESSAGE);
      }
    } catch {
      setPhase("reconciliation");
      showError(UNCERTAIN_TRANSFER_MESSAGE);
    }
  }

  return <div className="v2-premium-form v2-donation-form">
    <div className="v2-form-heading"><span>{method === "DIRECT_UPI" ? "Direct UPI" : "Bank transfer"}</span><h2>{method === "DIRECT_UPI" ? "Pay Amaana directly by UPI." : "Transfer directly to Amaana Foundation."}</h2><p>Complete the transfer using the verified details below, then submit the UTR/reference so Amaana can reconcile it. Your appeal total changes only after verification.</p></div>
    {method === "DIRECT_UPI" ? <section className="card" aria-label="Verified UPI details"><p><strong>UPI ID</strong><br/><code>{paymentDetails.upi.id}</code></p><p><button type="button" className="v2-text-link" onClick={() => copy(paymentDetails.upi.id, "UPI ID")}>Copy UPI ID</button> · <a className="v2-text-link" href={upiUri}>Open UPI app</a></p>{paymentDetails.upi.qrImageUrl ? <Image src={paymentDetails.upi.qrImageUrl} alt="Amaana Foundation verified UPI payment QR code" width={240} height={240} priority={false}/> : <p className="form-error">Verified QR image is not configured yet. Use the UPI ID above; the site will not display an unverified QR.</p>}</section> : paymentDetails.bank ? <section className="card" aria-label="Verified bank transfer details"><dl className="details"><div><dt>Account name</dt><dd>{paymentDetails.bank.accountName}</dd></div><div><dt>Account number</dt><dd>{paymentDetails.bank.accountNumber} <button type="button" className="v2-text-link" onClick={() => copy(paymentDetails.bank!.accountNumber, "Account number")}>Copy</button></dd></div><div><dt>IFSC</dt><dd>{paymentDetails.bank.ifsc} <button type="button" className="v2-text-link" onClick={() => copy(paymentDetails.bank!.ifsc, "IFSC")}>Copy</button></dd></div><div><dt>Bank</dt><dd>{paymentDetails.bank.bankName}</dd></div><div><dt>Branch</dt><dd>{paymentDetails.bank.branch}</dd></div></dl></section> : <div className="form-error" role="alert">Official bank-transfer details are not configured. Amaana will not display guessed or incomplete banking information.</div>}
    <p role="status" aria-live="polite">{copyStatus}</p>
    <form ref={formRef} onSubmit={submit} onInvalid={handleInvalid} className="form-grid" aria-busy={busy}>
      {error && <div ref={errorRef} className="form-error field full" role="alert" tabIndex={-1}>{error}{phase === "reconciliation" && <p><a className="v2-text-link" href="/contact">Contact Amaana about this transfer</a></p>}</div>}
      <div className="field"><label htmlFor={`direct-name-${method}`}>Full name</label><input id={`direct-name-${method}`} name="donorName" {...fieldProps("donorName")} autoComplete="name" minLength={2} required disabled={locked || bankUnavailable}/>{fieldError("donorName")}</div>
      <div className="field"><label htmlFor={`direct-email-${method}`}>Email</label><input id={`direct-email-${method}`} name="donorEmail" {...fieldProps("donorEmail")} type="email" autoComplete="email" required disabled={locked || bankUnavailable}/>{fieldError("donorEmail")}</div>
      <div className="field"><label htmlFor={`direct-phone-${method}`}>Phone <span className="muted">optional</span></label><input id={`direct-phone-${method}`} name="donorPhone" {...fieldProps("donorPhone")} type="tel" autoComplete="tel" disabled={locked || bankUnavailable}/>{fieldError("donorPhone")}</div>
      <div className="field"><label htmlFor={`direct-amount-${method}`}>Amount (INR)</label><input id={`direct-amount-${method}`} name="amount" {...fieldProps("amount", `direct-amount-hint-${method}`)} type="text" inputMode="numeric" pattern="[0-9]+" maxLength={12} onInput={event => updateDonationAmountValidity(event.currentTarget, transactionMin, transactionMax)} required disabled={locked || bankUnavailable}/><small id={`direct-amount-hint-${method}`}>Whole rupees only. {transactionMax < 10 ? `Enter exactly ₹${transactionMax.toLocaleString("en-IN")}.` : `₹${transactionMin.toLocaleString("en-IN")} to ₹${transactionMax.toLocaleString("en-IN")}.`}</small>{fieldError("amount")}</div>
      <div className="field"><label htmlFor={`direct-reference-${method}`}>UTR / transaction reference</label><input id={`direct-reference-${method}`} name="transferReference" {...fieldProps("transferReference")} minLength={6} maxLength={100} required disabled={locked || bankUnavailable}/>{fieldError("transferReference")}</div>
      <div className="field"><label htmlFor={`direct-date-${method}`}>Transfer date and time</label><input id={`direct-date-${method}`} name="transferredAt" {...fieldProps("transferredAt")} type="datetime-local" required disabled={locked || bankUnavailable}/>{fieldError("transferredAt")}</div>
      <div className="field full"><label htmlFor={`direct-evidence-${method}`}>Screenshot / receipt <span className="muted">optional, max 5 MB</span></label><input id={`direct-evidence-${method}`} name="evidence" {...fieldProps("evidence")} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={locked || bankUnavailable}/><small>Supporting evidence only. It does not prove receipt until an Amaana administrator verifies the transfer.</small>{fieldError("evidence")}</div>
      <fieldset className="field full" disabled={locked || bankUnavailable} aria-invalid={Boolean(fieldErrors.givingIntent?.length) || undefined} aria-describedby={fieldErrors.givingIntent?.length ? `direct-givingIntent-error-${method}` : undefined}><legend>Giving intention</legend>{(["GENERAL","SADAQAH",...(zakatEligible?["ZAKAT"]:[])] as DonationIntentValue[]).map((intent,index)=><label className="checkbox" key={intent}><input type="radio" name="givingIntent" {...fieldProps("givingIntent")} value={intent} required defaultChecked={index===0}/><span><strong>{DONATION_INTENT_LABELS[intent]}</strong><small>{DONATION_INTENT_DESCRIPTIONS[intent]}</small></span></label>)}{fieldError("givingIntent")}</fieldset>
      <div className="field full"><label className="checkbox"><input name="isAnonymous" type="checkbox" disabled={locked || bankUnavailable}/><span><strong>Keep my public identity private</strong></span></label></div>
      <div className="field full"><label className="checkbox"><input name="domesticConfirmed" {...fieldProps("domesticConfirmed")} type="checkbox" required disabled={locked || bankUnavailable}/><span><strong>Domestic contribution confirmation</strong><small>I confirm this contribution is from an Indian source using a domestic account/payment method.</small></span></label>{fieldError("domesticConfirmed")}</div>
      <div className="field full"><button className="v2-button" type="submit" disabled={locked || bankUnavailable}>{busy ? "Submitting for verification…" : phase === "reconciliation" ? "Transfer follow-up required" : phase === "submitted" ? "Transfer submitted" : "Submit transfer for verification"}</button><small>This submission remains Pending Verification until Amaana matches it to the Foundation&apos;s received funds.</small></div>
    </form>
  </div>;
}
