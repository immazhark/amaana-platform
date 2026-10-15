"use client";

import { getWholeRupeeCheckoutRange, updateDonationAmountValidity } from "@/lib/donation-amount-input";

import { DonationInputField } from "./donation-input-field";
import { type FormEvent, type InputHTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/navigation-link";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import { DONATION_INTENT_DESCRIPTIONS, DONATION_INTENT_LABELS, type DonationIntentValue } from "@/lib/donation-intent";
import { classifyDirectTransferResponse, isDirectTransferField, UNCERTAIN_TRANSFER_MESSAGE, type DirectTransferField, type DirectTransferFieldErrors } from "@/lib/direct-transfer-feedback";

type Method = "DIRECT_UPI" | "BANK_TRANSFER";

export function DirectTransferForm({ appealId, maxAmount, zakatEligible, method, instructions, bankAvailable, onSubmissionLockChange }: { appealId: string; maxAmount: number; zakatEligible: boolean; method: Method; instructions: ReactNode; bankAvailable: boolean; onSubmissionLockChange?: (locked: boolean) => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<DirectTransferFieldErrors>({});
  const [phase, setPhase] = useState<"ready" | "submitting" | "submitted" | "reconciliation">("ready");
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const submissionLocked = useRef(false);
  const focusRequest = useRef(0);
  const focusedRequest = useRef(0);
  const busy = phase === "submitting";
  const locked = phase !== "ready";
  const checkoutRange = getWholeRupeeCheckoutRange(maxAmount);
  const transactionMax = checkoutRange?.maximum ?? 0;
  const transactionMin = checkoutRange?.minimum ?? 1;
  const bankUnavailable = method === "BANK_TRANSFER" && !bankAvailable;

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

  function renderInput(field: DirectTransferField, label: ReactNode, attributes: InputHTMLAttributes<HTMLInputElement>, hint?: ReactNode, full = false) {
    const hintId = hint ? `direct-${field}-hint-${method}` : undefined;
    return <DonationInputField label={label} className={full ? "field full" : "field"}
      input={{ ...attributes, id: `direct-${field}-${method}`, name: field, ...fieldProps(field, hintId), disabled: locked || bankUnavailable || !checkoutRange }}
      error={fieldErrors[field]?.[0]} errorId={`direct-${field}-error-${method}`}
      hint={hint ? <small id={hintId}>{hint}</small> : undefined}/>;
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLocked.current || bankUnavailable || !checkoutRange) return;
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
    {checkoutRange ? instructions : null}
    {!checkoutRange && <p role="status" className="form-error">The reviewed remaining balance cannot accept a whole-rupee contribution. Please check with Amaana before transferring an unsupported amount.</p>}
    <form ref={formRef} onSubmit={submit} onInvalid={handleInvalid} className="form-grid" aria-busy={busy}>
      {error && <div ref={errorRef} className="form-error field full" role="alert" tabIndex={-1}>{error}{phase === "reconciliation" && <p><Link className="v2-text-link" href="/contact">Contact Amaana about this transfer</Link></p>}</div>}
      {renderInput("donorName", "Full name", { autoComplete: "name", minLength: 2, required: true })}
      {renderInput("donorEmail", "Email", { type: "email", autoComplete: "email", required: true })}
      {renderInput("donorPhone", <>Phone <span className="muted">optional</span></>, { type: "tel", autoComplete: "tel" })}
      {renderInput("amount", "Amount (INR)", { type: "text", inputMode: "numeric", pattern: "[0-9]+", maxLength: 12, onInput: event => updateDonationAmountValidity(event.currentTarget, transactionMin, transactionMax), required: true }, <>Whole rupees only. {transactionMax < 10 ? `Enter exactly ₹${transactionMax.toLocaleString("en-IN")}.` : `₹${transactionMin.toLocaleString("en-IN")} to ₹${transactionMax.toLocaleString("en-IN")}.`}</>)}
      {renderInput("transferReference", "UTR / transaction reference", { minLength: 6, maxLength: 100, required: true })}
      {renderInput("transferredAt", "Transfer date and time", { type: "datetime-local", required: true })}
      {renderInput("evidence", <>Screenshot / receipt <span className="muted">optional, max 5 MB</span></>, { type: "file", accept: "image/jpeg,image/png,image/webp,application/pdf" }, "Supporting evidence only. It does not prove receipt until an Amaana administrator verifies the transfer.", true)}
      <fieldset className="field full" disabled={locked || bankUnavailable} aria-invalid={Boolean(fieldErrors.givingIntent?.length) || undefined} aria-describedby={fieldErrors.givingIntent?.length ? `direct-givingIntent-error-${method}` : undefined}><legend>Giving intention</legend>{(["GENERAL","SADAQAH",...(zakatEligible?["ZAKAT"]:[])] as DonationIntentValue[]).map((intent,index)=><label className="checkbox" key={intent}><input type="radio" name="givingIntent" {...fieldProps("givingIntent")} value={intent} required defaultChecked={index===0}/><span><strong>{DONATION_INTENT_LABELS[intent]}</strong><small>{DONATION_INTENT_DESCRIPTIONS[intent]}</small></span></label>)}{fieldError("givingIntent")}</fieldset>
      <div className="field full"><label className="checkbox"><input name="isAnonymous" type="checkbox" disabled={locked || bankUnavailable}/><span><strong>Keep my public identity private</strong></span></label></div>
      <div className="field full"><label className="checkbox"><input name="domesticConfirmed" {...fieldProps("domesticConfirmed")} type="checkbox" required disabled={locked || bankUnavailable}/><span><strong>Domestic contribution confirmation</strong><small>I confirm this contribution is from an Indian source using a domestic account/payment method.</small></span></label>{fieldError("domesticConfirmed")}</div>
      <div className="field full"><button className="v2-button" type="submit" disabled={locked || bankUnavailable || !checkoutRange}>{busy ? "Submitting for verification…" : phase === "reconciliation" ? "Transfer follow-up required" : phase === "submitted" ? "Transfer submitted" : "Submit transfer for verification"}</button><small>This submission remains Pending Verification until Amaana matches it to the Foundation&apos;s received funds.</small></div>
    </form>
  </div>;
}
