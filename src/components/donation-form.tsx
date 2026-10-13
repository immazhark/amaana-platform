"use client";

import { updateDonationAmountValidity } from "@/lib/donation-amount-input";

import Script from "next/script";
import { DonationInputField } from "./donation-input-field";
import { type FormEvent, type InputHTMLAttributes, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import { DONATION_INTENT_DESCRIPTIONS, DONATION_INTENT_LABELS, type DonationIntentValue } from "@/lib/donation-intent";
import styles from "./donation-form.module.css";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email: string; contact?: string }; handler: (response: RazorpayResponse) => Promise<void>; modal: { ondismiss: () => void }; theme: { color: string } };
type CheckoutPhase = "loading" | "ready" | "opening" | "verifying" | "reconciliation";
type DonationField = "donorName" | "donorEmail" | "donorPhone" | "amount" | "givingIntent" | "domesticConfirmed";
type DonationFieldErrors = Partial<Record<DonationField, string[]>>;
type DonationOrderError = { error?: string; remainingAmount?: number; fields?: DonationFieldErrors };
declare global { interface Window { Razorpay: new (options: RazorpayOptions) => { open(): void } } }

export function DonationForm({ appealId, appealTitle, maxAmount, zakatEligible = false, onSubmissionLockChange }: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible?: boolean; onSubmissionLockChange?: (locked: boolean) => void }) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const focusedErrorRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<DonationFieldErrors>({});
  const [remainingHint, setRemainingHint] = useState<number | null>(null);
  const [phase, setPhase] = useState<CheckoutPhase>("loading");
  const phaseRef = useRef<CheckoutPhase>("loading");
  const checkoutAttempt = useRef(0);
  const changePhase = useCallback((next: CheckoutPhase) => {
    if (!formRef.current?.isConnected) return;
    // Update the guard before React commits so duplicate submit events and
    // method changes in the same event cannot discard an in-flight payment.
    phaseRef.current = next;
    onSubmissionLockChange?.(next === "opening" || next === "verifying" || next === "reconciliation");
    setPhase(next);
  }, [onSubmissionLockChange]);
  const transactionMax = Math.min(maxAmount, 1_000_000);
  const transactionMin = transactionMax < 10 ? transactionMax : 10;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (window.Razorpay && phaseRef.current === "loading") {
        changePhase("ready");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [changePhase]);

  useEffect(() => {
    if (!error) {
      focusedErrorRef.current = null;
      return;
    }
    // Editing a field may change fieldErrors while the alert remains displayed.
    // Do not steal focus from the donor after the initial error announcement.
    if (focusedErrorRef.current === error) return;
    const firstRejectedField = (["amount", "donorName", "donorEmail", "donorPhone", "givingIntent", "domesticConfirmed"] as DonationField[])
      .find(field => fieldErrors[field]?.length);
    const frame = window.requestAnimationFrame(() => {
      // Commit the focus marker only when the callback actually executes.
      // A field-error state update may cancel this frame before focus occurs.
      focusedErrorRef.current = error;
      if (!firstRejectedField) {
        errorRef.current?.focus();
        return;
      }
      const control = formRef.current?.elements.namedItem(firstRejectedField);
      if (control instanceof HTMLElement) {
        control.focus();
      } else if (control instanceof RadioNodeList) {
        const radios = Array.from(control).filter((item): item is HTMLInputElement => item instanceof HTMLInputElement);
        const focusTarget = radios.find(radio => radio.checked) ?? radios[0];
        if (focusTarget) focusTarget.focus();
        else errorRef.current?.focus();
      } else {
        errorRef.current?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, fieldErrors]);

  const busy = phase === "opening" || phase === "verifying";
  const submissionLocked = busy || phase === "reconciliation";
  const lockedForReconciliation = phase === "reconciliation";
  const scriptReady = phase !== "loading";
  const statusText = phase === "loading"
    ? "Preparing secure checkout."
    : phase === "opening"
      ? "Opening Razorpay secure checkout."
      : phase === "verifying"
        ? "Payment received. Verifying your donation with Amaana."
        : phase === "reconciliation"
          ? "Payment verification needs follow-up. Please do not submit another payment for this donation."
          : "Secure checkout is ready.";

  function showError(message: string) {
    if (formRef.current?.isConnected) setError(message);
  }

  function isOpeningAttempt(attempt: number) {
    return Boolean(formRef.current?.isConnected) && checkoutAttempt.current === attempt && phaseRef.current === "opening";
  }

  function resetUnpaidCheckout(attempt: number) {
    if (isOpeningAttempt(attempt)) changePhase("ready");
  }

  function fieldError(field: DonationField) {
    return fieldErrors[field]?.[0];
  }

  function clearFieldError(field: DonationField) {
    setFieldErrors(current => current[field] ? { ...current, [field]: undefined } : current);
  }

  function renderInput(field: DonationField, label: ReactNode, attributes: InputHTMLAttributes<HTMLInputElement>, full = false, hint?: ReactNode) {
    const amount = field === "amount";
    const errorId = `${field.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}-error`;
    const description = [amount ? "amount-hint" : undefined, fieldError(field) ? errorId : undefined, field !== "donorPhone" ? "donation-checkout-status" : undefined].filter(Boolean).join(" ") || undefined;
    return <DonationInputField label={label} labelClassName={styles.checkoutLabel}
      className={`field ${full ? "full" : ""} ${amount ? "v2-amount-field" : ""} ${styles.checkoutShell}`}
      controlClassName={`${styles.checkoutControl} ${amount ? styles.amountControl : ""}`}
      prefix={amount ? <b aria-hidden="true">₹</b> : undefined} hint={hint}
      input={{ ...attributes, id: field, name: field, disabled: submissionLocked, "aria-invalid": Boolean(fieldError(field)) || undefined, "aria-describedby": description, onChange: () => clearFieldError(field) }}
      error={fieldError(field)} errorId={errorId}/>;
  }

  function handleInvalid(event: FormEvent<HTMLFormElement>) {
    // React bubbles invalid events; replace transient browser popups with a
    // persistent field-specific explanation linked through aria-describedby.
    event.preventDefault();
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
    const field = control.name as DonationField;
    if (!(["donorName", "donorEmail", "donorPhone", "amount", "givingIntent", "domesticConfirmed"] as string[]).includes(field)) return;
    setFieldErrors(current => ({
      ...current,
      [field]: [control.validationMessage || "Please check this field."],
    }));
    // Only focus the first invalid control after React commits its error.
    if (formRef.current?.querySelector(":invalid") === control) {
      requestAnimationFrame(() => requestAnimationFrame(() => control.focus()));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phaseRef.current === "opening" || phaseRef.current === "verifying" || phaseRef.current === "reconciliation") return;
    setError("");
    setFieldErrors({});
    setRemainingHint(null);
    if (lockedForReconciliation) {
      showError("Please do not submit another payment while this donation is being reconciled.");
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      showError("Secure checkout is still loading. Please try again.");
      return;
    }

    const attempt = ++checkoutAttempt.current;
    changePhase("opening");
    const values = new FormData(event.currentTarget);

    try {
      const orderResponse = await fetch("/api/donations/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appealId,
          donorName: values.get("donorName"),
          donorEmail: values.get("donorEmail"),
          donorPhone: values.get("donorPhone"),
          amount: values.get("amount"),
          givingIntent: values.get("givingIntent"),
          isAnonymous: values.get("isAnonymous") === "on",
          domesticConfirmed: values.get("domesticConfirmed") === "on",
        }),
      });
      const order = await orderResponse.json().catch(() => null) as (DonationOrderError & {
        keyId: string;
        amount: number;
        currency: string;
        orderId: string;
        donor: { name: string; email: string; contact?: string };
        receiptToken: string;
      }) | null;
      // A delayed payment callback can supersede this pending order request.
      // Reconcile that reported payment without opening another checkout.
      if (!isOpeningAttempt(attempt)) return;
      if (!orderResponse.ok) {
        if (typeof order?.remainingAmount === "number") setRemainingHint(order.remainingAmount);
        if (order?.fields) setFieldErrors(order.fields);
        throw new Error(typeof order?.error === "string" ? order.error.slice(0, 500) : "Could not start checkout");
      }

      // A successful HTTP response is not proof of a usable checkout order.
      // An order may already exist, so an invalid payload locks out retries.
      if (orderResponse.status !== 201 || !order ||
        typeof order.orderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(order.orderId) ||
        !Number.isSafeInteger(order.amount) || order.amount !== Number(values.get("amount")) * 100 ||
        order.currency !== "INR" ||
        typeof order.keyId !== "string" || !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(order.keyId) ||
        typeof order.receiptToken !== "string" || !order.receiptToken.trim() || order.receiptToken.length > 512 ||
        !order.donor || typeof order.donor.name !== "string" || !order.donor.name.trim() ||
        typeof order.donor.email !== "string" || !order.donor.email.trim() ||
        (order.donor.contact != null && typeof order.donor.contact !== "string")) {
        showError("The secure checkout response could not be verified. An order may have been recorded; contact Amaana before another attempt.");
        changePhase("reconciliation");
        return;
      }

      let paymentReported = false;
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Amaana Foundation",
        description: appealTitle,
        order_id: order.orderId,
        prefill: order.donor,
        theme: { color: "#466FAA" },
        modal: { ondismiss: () => {
          if (!paymentReported) resetUnpaidCheckout(attempt);
        } },
        handler: async payment => {
          if (paymentReported) return;
          paymentReported = true;
          changePhase("verifying");
          try {
            const confirmation = await fetch("/api/donations/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payment, receiptToken: order.receiptToken }),
            });
            const result = await confirmation.json();
            if (!confirmation.ok) {
              showError(typeof result?.error === "string" && result.error.trim() ? result.error.slice(0, 500) : "Payment verification is pending. Please retain your Razorpay payment confirmation and do not submit another payment.");
              changePhase("reconciliation");
              return;
            }
            if (typeof result?.referenceNumber !== "string" || !/^[A-Za-z0-9-]{1,80}$/.test(result.referenceNumber)) throw new Error("Invalid confirmation reference");
            if (formRef.current?.isConnected) router.push(privateDonationAcknowledgementPath(result.referenceNumber, order.receiptToken));
          } catch {
            showError("We could not complete payment verification in this browser. Please retain your Razorpay payment confirmation and do not submit another payment. Amaana can reconcile the payment without asking for your OTP, UPI PIN or card credentials.");
            changePhase("reconciliation");
          }
        },
      });
      checkout.open();
    } catch (caught) {
      if (!isOpeningAttempt(attempt)) return;
      showError(caught instanceof Error ? caught.message : "Could not start checkout");
      resetUnpaidCheckout(attempt);
    }
  }

  return <>
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="lazyOnload"
      onReady={() => { if (phaseRef.current === "loading") changePhase("ready"); }}
      onError={() => {
        if (phaseRef.current !== "loading" && phaseRef.current !== "ready") return;
        changePhase("loading");
        showError("Secure checkout could not load. Please refresh and try again.");
      }}
    />
    <form ref={formRef} className="v2-premium-form v2-donation-form" onSubmit={submit} onInvalid={handleInvalid} aria-busy={busy} aria-labelledby="donation-form-heading" aria-describedby="donation-form-description donation-checkout-status">
      <div className="v2-form-heading"><span>Secure contribution</span><h2 id="donation-form-heading">Choose how you would like to support.</h2><p id="donation-form-description">Only the information needed to process and acknowledge your contribution is requested.</p></div>
      <p id="donation-checkout-status" className={styles.status} role="status" aria-live="polite">{statusText}</p>
      {error && <div ref={errorRef} className="form-error" role="alert" aria-live="assertive" tabIndex={-1}>{error}{remainingHint !== null ? <p><button type="button" className="v2-text-link" onClick={() => { const input = formRef.current?.elements.namedItem("amount"); if (input instanceof HTMLInputElement) { input.value = String(remainingHint); updateDonationAmountValidity(input, transactionMin, transactionMax); clearFieldError("amount"); input.focus(); } }}>Use the current remaining amount: ₹{remainingHint.toLocaleString("en-IN")}</button></p> : null}</div>}
      <div className="form-grid">
        {renderInput("amount", <>Donation amount <span>INR</span></>, { type: "text", inputMode: "numeric", pattern: "[0-9]+", maxLength: 12, onInput: event => updateDonationAmountValidity(event.currentTarget, transactionMin, transactionMax), placeholder: "Enter amount", required: true }, true, <small id="amount-hint" className={styles.hint}>{transactionMax < 10 ? `₹${transactionMax.toLocaleString("en-IN")} is the exact amount remaining to complete this appeal.` : `Maximum available for this transaction: ₹${transactionMax.toLocaleString("en-IN")}.`}</small>)}
        {renderInput("donorName", "Full name", { autoComplete: "name", minLength: 2, maxLength: 120, required: true })}
        {renderInput("donorEmail", "Email", { type: "email", autoComplete: "email", maxLength: 254, required: true })}
        {renderInput("donorPhone", <>Phone <span className="muted">optional</span></>, { type: "tel", autoComplete: "tel" }, true)}
        <fieldset className={`field full ${styles.intentGroup}`} disabled={submissionLocked} aria-invalid={Boolean(fieldError("givingIntent")) || undefined} aria-describedby={fieldError("givingIntent") ? "giving-intent-error" : undefined}>
          <legend>Giving intention</legend>
          <p className={styles.intentIntro}>Choose how you want this contribution recorded. The selected appeal remains the designated destination in every case.</p>
          <div className={styles.intentGrid}>
            {(["GENERAL", "SADAQAH", ...(zakatEligible ? ["ZAKAT"] : [])] as DonationIntentValue[]).map((intent, index) => (
              <label className={styles.intentOption} key={intent}>
                <input type="radio" name="givingIntent" value={intent} defaultChecked={index === 0} required />
                <span><strong>{DONATION_INTENT_LABELS[intent]}</strong><small>{DONATION_INTENT_DESCRIPTIONS[intent]}</small></span>
              </label>
            ))}
          </div>
          {fieldError("givingIntent") && <small id="giving-intent-error" className="v2-field-error">{fieldError("givingIntent")}</small>}
          <small className={styles.intentNote}>{zakatEligible ? "Amaana has explicitly reviewed this appeal as Zakat-eligible. Your selection records your giving intention; it does not alter the underlying verification record." : "Zakat is shown only on appeals that Amaana has explicitly reviewed as Zakat-eligible."}</small>
        </fieldset>
        <div className={`field full v2-form-choice ${styles.choice}`}><label className="checkbox"><input name="isAnonymous" type="checkbox" disabled={submissionLocked}/><span><strong>Keep my public identity private</strong><small>Do not show my name in any public donor listing.</small></span></label></div>
        <div className={`field full v2-form-choice ${styles.choice}`}><label className="checkbox"><input name="domesticConfirmed" type="checkbox" required disabled={submissionLocked} aria-invalid={Boolean(fieldError("domesticConfirmed")) || undefined} aria-describedby={fieldError("domesticConfirmed") ? "domestic-confirmation-error" : undefined} onChange={() => clearFieldError("domesticConfirmed")}/><span><strong>Domestic contribution confirmation</strong><small>I confirm this donation is from an Indian source using a domestic payment method.</small></span></label>{fieldError("domesticConfirmed") && <small id="domestic-confirmation-error" className="v2-field-error">{fieldError("domesticConfirmed")}</small>}</div>
        <div className="field full v2-form-submit"><button className="v2-button" type="submit" disabled={busy || !scriptReady || lockedForReconciliation}>{phase === "opening" ? "Opening secure checkout…" : phase === "verifying" ? "Verifying donation…" : phase === "reconciliation" ? "Verification follow-up required" : scriptReady ? "Continue securely →" : "Preparing secure checkout…"}</button><small>{lockedForReconciliation ? "Do not submit another payment for this donation. Keep your Razorpay confirmation so the payment can be reconciled safely." : "Next: Razorpay secure checkout. Your Amaana acknowledgement follows successful payment verification and is not an 80G tax-deduction certificate."}</small></div>
      </div>
    </form>
  </>;
}
