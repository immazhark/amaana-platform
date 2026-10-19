"use client";

import { getDonationAmountPresets, getWholeRupeeCheckoutRange, updateDonationAmountValidity } from "@/lib/donation-amount-input";

import Script from "next/script";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import type { DonationFormCopy } from "./donation-form-copy";
import styles from "./donation-form.module.css";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email: string; contact?: string }; handler: (response: RazorpayResponse) => Promise<void>; modal: { ondismiss: () => void }; theme: { color: string } };
type CheckoutPhase = "loading" | "ready" | "opening" | "verifying" | "reconciliation";
type DonationField = "donorName" | "donorEmail" | "donorPhone" | "amount" | "givingIntent" | "domesticConfirmed";
type DonationFieldErrors = Partial<Record<DonationField, string[]>>;
const ORDER_FIELDS = ["donorName", "donorEmail", "donorPhone", "amount", "givingIntent", "domesticConfirmed"] as const;
const ORDER_UNCERTAIN = "Checkout status is uncertain. An order may have been created. Contact Amaana before starting another payment.";

declare global { interface Window { Razorpay: new (options: RazorpayOptions) => { open(): void } } }

export function DonationForm({ appealId, appealTitle, maxAmount, copy, onLockChange }: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible?: boolean; copy: DonationFormCopy; onLockChange?: (locked: boolean) => void }) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const focusedErrorRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const orderLocked = useRef(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<DonationFieldErrors>({});
  const [remainingHint, setRemainingHint] = useState<number | null>(null);
  const [liveRange, setLiveRange] = useState<{ minimum: number; maximum: number } | null>(null);
  const [phase, setPhase] = useState<CheckoutPhase>("loading");
  const transactionMax = liveRange?.maximum ?? Math.min(maxAmount, 1_000_000);
  const transactionMin = liveRange?.minimum ?? (transactionMax < 10 ? transactionMax : 10);
  const presetAmounts = getDonationAmountPresets(transactionMax);

  useEffect(() => {
    const amount = formRef.current?.elements.namedItem("amount");
    if (amount instanceof HTMLInputElement) {
      updateDonationAmountValidity(amount, transactionMin, transactionMax);
    }
  }, [transactionMin, transactionMax]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (window.Razorpay) {
        setPhase(current => current === "reconciliation" ? current : "ready");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
    setError(message);
  }

  function fieldError(field: DonationField) {
    return fieldErrors[field]?.[0];
  }

  function clearFieldError(field: DonationField) {
    setFieldErrors(current => current[field] ? { ...current, [field]: undefined } : current);
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
    if (orderLocked.current || submissionLocked) return;
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

    orderLocked.current = true;
    onLockChange?.(true);
    setPhase("opening");
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
      const payload: unknown = await orderResponse.json();
      // The user may have left while the provider order was being prepared.
      if (!formRef.current?.isConnected) return;
      const order = payload && typeof payload === "object" && !Array.isArray(payload)
        ? payload as Record<string, unknown> : {};
      if (!orderResponse.ok) {
        // Only these documented API outcomes are known to occur before order creation.
        if (![400, 403, 409, 413, 429].includes(orderResponse.status) ||
            typeof order.error !== "string" || !order.error.trim()) {
          throw new Error(ORDER_UNCERTAIN);
        }
        const fields: DonationFieldErrors = {};
        if (order.fields && typeof order.fields === "object" && !Array.isArray(order.fields)) {
          const source = order.fields as Record<string, unknown>;
          for (const field of ORDER_FIELDS) {
            const messages = source[field];
            const first = Array.isArray(messages)
              ? messages.find((item): item is string => typeof item === "string" && Boolean(item.trim()))
              : undefined;
            if (first) fields[field] = [first.trim().slice(0, 300)];
          }
        }
        setFieldErrors(fields);
        if (typeof order.remainingAmount === "number") {
          const payable = getWholeRupeeCheckoutRange(Math.min(order.remainingAmount, maxAmount));
          if (payable) {
            setLiveRange(payable);
            setRemainingHint(payable.maximum);
          }
        }
        showError(order.error.trim().slice(0, 500));
        orderLocked.current = false;
        onLockChange?.(false);
        setPhase("ready");
        return;
      }
      const donor = order.donor && typeof order.donor === "object" && !Array.isArray(order.donor)
        ? order.donor as Record<string, unknown> : {};
      // Malformed success is ambiguous: never open checkout or issue a new order.
      if (orderResponse.status !== 201 ||
          typeof order.orderId !== "string" || !/^order_[A-Za-z0-9_]{1,120}$/.test(order.orderId) ||
          !Number.isSafeInteger(order.amount) || order.amount !== Number(values.get("amount")) * 100 ||
          order.currency !== "INR" ||
          typeof order.keyId !== "string" || !/^rzp_(test|live)_[A-Za-z0-9_]{1,120}$/.test(order.keyId) ||
          typeof order.receiptToken !== "string" || !/^[A-Za-z0-9_-]{20,512}$/.test(order.receiptToken) ||
          typeof donor.name !== "string" || !donor.name.trim() ||
          typeof donor.email !== "string" || !donor.email.trim() ||
          (donor.contact != null && typeof donor.contact !== "string")) {
        throw new Error(ORDER_UNCERTAIN);
      }
      const receiptToken = order.receiptToken as string;
      let paymentReported = false;
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Amaana Foundation",
        description: appealTitle,
        order_id: order.orderId,
        prefill: { name: donor.name, email: donor.email, ...(typeof donor.contact === "string" ? { contact: donor.contact } : {}) },
        theme: { color: "#466FAA" },
        modal: { ondismiss: () => {
          if (!paymentReported) {
            orderLocked.current = false;
            onLockChange?.(false);
            setPhase("ready");
          }
        } },
        handler: async payment => {
          if (paymentReported) return;
          paymentReported = true;
          setPhase("verifying");
          try {
            const confirmation = await fetch("/api/donations/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payment, receiptToken }),
            });
            const result: unknown = await confirmation.json();
            const confirmed = result && typeof result === "object" && !Array.isArray(result)
              ? result as Record<string, unknown> : {};
            if (!confirmation.ok || (confirmed.status !== "CAPTURED" && confirmed.status !== "REFUNDED") ||
                typeof confirmed.referenceNumber !== "string" ||
                !/^[A-Za-z0-9-]{1,80}$/.test(confirmed.referenceNumber)) {
              showError(typeof confirmed.error === "string" && confirmed.error.trim()
                ? confirmed.error.trim().slice(0, 500)
                : "Payment verification is pending. Please retain your Razorpay payment confirmation and do not submit another payment.");
              setPhase("reconciliation");
              return;
            }
            if (formRef.current?.isConnected) router.push(privateDonationAcknowledgementPath(confirmed.referenceNumber, receiptToken));
          } catch {
            showError("We could not complete payment verification in this browser. Please retain your Razorpay payment confirmation and do not submit another payment. Amaana can reconcile the payment without asking for your OTP, UPI PIN or card credentials.");
            setPhase("reconciliation");
          }
        },
      });
      checkout.open();
    } catch {
      showError(ORDER_UNCERTAIN);
      setPhase("reconciliation");
    }
  }

  return <>
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="lazyOnload"
      onReady={() => setPhase(current => current === "loading" ? "ready" : current)}
      onError={() => {
        setPhase(current => current === "ready" ? "loading" : current);
        showError("Secure checkout could not load. Please refresh and try again.");
      }}
    />
    <form ref={formRef} className="v2-premium-form v2-donation-form" onSubmit={submit} onInvalid={handleInvalid} aria-busy={busy} aria-labelledby="donation-form-heading" aria-describedby="donation-form-description donation-checkout-status">
      {copy.heading}
      <p id="donation-checkout-status" className={styles.status} role="status" aria-live="polite">{statusText}</p>
      {error && <div ref={errorRef} className="form-error" role="alert" aria-live="assertive" tabIndex={-1}>{error}{remainingHint !== null ? <p><button type="button" className="v2-text-link" onClick={() => { const input = formRef.current?.elements.namedItem("amount"); if (input instanceof HTMLInputElement) { input.value = String(remainingHint); updateDonationAmountValidity(input, transactionMin, transactionMax); clearFieldError("amount"); input.focus(); } }}>Use the payable amount: ₹{remainingHint.toLocaleString("en-IN")}</button></p> : null}</div>}
      <div className="form-grid">
        <div className={`field full v2-amount-field ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="amount">Donation amount <span>INR</span></label><div className={`${styles.checkoutControl} ${styles.amountControl}`}><b aria-hidden="true">₹</b><input id="amount" name="amount" type="text" inputMode="numeric" pattern="[0-9]+" maxLength={12} onInput={event => updateDonationAmountValidity(event.currentTarget, transactionMin, transactionMax)} placeholder="Enter amount" required disabled={submissionLocked} aria-invalid={Boolean(fieldError("amount")) || undefined} aria-describedby={fieldError("amount") ? "amount-hint amount-error donation-checkout-status" : "amount-hint donation-checkout-status"} onChange={() => clearFieldError("amount")}/></div><small id="amount-hint" className={styles.hint}>{transactionMax < 10 ? `₹${transactionMax.toLocaleString("en-IN")} is the exact amount remaining to complete this appeal.` : `Maximum available for this transaction: ₹${transactionMax.toLocaleString("en-IN")}.`}</small>{presetAmounts.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: ".55rem", margin: ".25rem 0" }} role="group" aria-label="Suggested amounts in INR">
          {presetAmounts.map(amount => <button
            key={amount}
            type="button"
            className="v2-button v2-button--paper-secondary"
            disabled={submissionLocked}
            aria-label={`Use ₹${amount.toLocaleString("en-IN")} for this donation`}
            onClick={() => {
              if (orderLocked.current || submissionLocked) return;
              const input = formRef.current?.elements.namedItem("amount");
              if (!(input instanceof HTMLInputElement) || input.disabled) return;
              input.value = String(amount);
              updateDonationAmountValidity(input, transactionMin, transactionMax);
              clearFieldError("amount");
              input.focus();
            }}
          >₹{amount.toLocaleString("en-IN")}</button>)}
        </div>}{fieldError("amount") && <small id="amount-error" className="v2-field-error">{fieldError("amount")}</small>}</div>
        <div className={`field ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="donorName">Full name</label><div className={styles.checkoutControl}><input id="donorName" name="donorName" autoComplete="name" minLength={2} maxLength={120} required disabled={submissionLocked} aria-invalid={Boolean(fieldError("donorName")) || undefined} aria-describedby={fieldError("donorName") ? "donor-name-error donation-checkout-status" : "donation-checkout-status"} onChange={() => clearFieldError("donorName")}/></div>{fieldError("donorName") && <small id="donor-name-error" className="v2-field-error">{fieldError("donorName")}</small>}</div>
        <div className={`field ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="donorEmail">Email</label><div className={styles.checkoutControl}><input id="donorEmail" name="donorEmail" type="email" autoComplete="email" maxLength={254} required disabled={submissionLocked} aria-invalid={Boolean(fieldError("donorEmail")) || undefined} aria-describedby={fieldError("donorEmail") ? "donor-email-error donation-checkout-status" : "donation-checkout-status"} onChange={() => clearFieldError("donorEmail")}/></div>{fieldError("donorEmail") && <small id="donor-email-error" className="v2-field-error">{fieldError("donorEmail")}</small>}</div>
        <div className={`field full ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="donorPhone">Phone <span className="muted">optional</span></label><div className={styles.checkoutControl}><input id="donorPhone" name="donorPhone" type="tel" autoComplete="tel" disabled={submissionLocked} aria-invalid={Boolean(fieldError("donorPhone")) || undefined} aria-describedby={fieldError("donorPhone") ? "donor-phone-error" : undefined} onChange={() => clearFieldError("donorPhone")}/></div>{fieldError("donorPhone") && <small id="donor-phone-error" className="v2-field-error">{fieldError("donorPhone")}</small>}</div>
        <fieldset className={`field full ${styles.intentGroup}`} disabled={submissionLocked} aria-invalid={Boolean(fieldError("givingIntent")) || undefined} aria-describedby={fieldError("givingIntent") ? "giving-intent-error" : undefined}>
          <legend>Giving intention</legend>
          {copy.intentIntroduction}
          <div className={styles.intentGrid}>
            {copy.intentionOptions}
          </div>
          {fieldError("givingIntent") && <small id="giving-intent-error" className="v2-field-error">{fieldError("givingIntent")}</small>}
          {copy.intentionNote}
        </fieldset>
        <div className={`field full v2-form-choice ${styles.choice}`}><label className="checkbox"><input name="isAnonymous" type="checkbox" disabled={submissionLocked}/>{copy.anonymityText}</label></div>
        <div className={`field full v2-form-choice ${styles.choice}`}><label className="checkbox"><input name="domesticConfirmed" type="checkbox" required disabled={submissionLocked} aria-invalid={Boolean(fieldError("domesticConfirmed")) || undefined} aria-describedby={fieldError("domesticConfirmed") ? "domestic-confirmation-error" : undefined} onChange={() => clearFieldError("domesticConfirmed")}/>{copy.domesticText}</label>{fieldError("domesticConfirmed") && <small id="domestic-confirmation-error" className="v2-field-error">{fieldError("domesticConfirmed")}</small>}</div>
        <div className="field full v2-form-submit"><button className="v2-button" type="submit" disabled={busy || !scriptReady || lockedForReconciliation}>{phase === "opening" ? "Opening secure checkout…" : phase === "verifying" ? "Verifying donation…" : phase === "reconciliation" ? "Verification follow-up required" : scriptReady ? "Continue securely →" : "Preparing secure checkout…"}</button>{lockedForReconciliation ? <small>Do not submit another payment for this donation. Keep your Razorpay confirmation so the payment can be reconciled safely.</small> : copy.readyHelp}</div>
      </div>
    </form>
  </>;
}
