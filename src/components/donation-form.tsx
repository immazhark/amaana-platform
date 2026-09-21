"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import { DONATION_INTENT_DESCRIPTIONS, DONATION_INTENT_LABELS, type DonationIntentValue } from "@/lib/donation-intent";
import styles from "./donation-form.module.css";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email: string; contact?: string }; handler: (response: RazorpayResponse) => Promise<void>; modal: { ondismiss: () => void }; theme: { color: string } };
type CheckoutPhase = "loading" | "ready" | "opening" | "verifying" | "reconciliation";
declare global { interface Window { Razorpay: new (options: RazorpayOptions) => { open(): void } } }

export function DonationForm({ appealId, appealTitle, maxAmount, zakatEligible = false }: { appealId: string; appealTitle: string; maxAmount: number; zakatEligible?: boolean }) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("loading");
  const transactionMax = Math.min(maxAmount, 1_000_000);
  const transactionMin = transactionMax < 10 ? transactionMax : 10;

  useEffect(() => {
    if (window.Razorpay) {
      setPhase(current => current === "reconciliation" ? current : "ready");
    }
  }, []);

  const busy = phase === "opening" || phase === "verifying";
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
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (lockedForReconciliation) {
      showError("Please do not submit another payment while this donation is being reconciled.");
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      showError("Secure checkout is still loading. Please try again.");
      return;
    }

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
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error ?? "Could not start checkout");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Amaana Foundation",
        description: appealTitle,
        order_id: order.orderId,
        prefill: order.donor,
        theme: { color: "#466FAA" },
        modal: { ondismiss: () => setPhase("ready") },
        handler: async payment => {
          setPhase("verifying");
          try {
            const confirmation = await fetch("/api/donations/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payment, receiptToken: order.receiptToken }),
            });
            const result = await confirmation.json();
            if (!confirmation.ok) {
              showError(result.error ?? "Payment verification is pending. Please retain your Razorpay payment confirmation and do not submit another payment.");
              setPhase("reconciliation");
              return;
            }
            router.push(privateDonationAcknowledgementPath(result.referenceNumber, order.receiptToken));
          } catch {
            showError("We could not complete payment verification in this browser. Please retain your Razorpay payment confirmation and do not submit another payment. Amaana can reconcile the payment without asking for your OTP, UPI PIN or card credentials.");
            setPhase("reconciliation");
          }
        },
      });
      checkout.open();
    } catch (caught) {
      showError(caught instanceof Error ? caught.message : "Could not start checkout");
      setPhase("ready");
    }
  }

  return <>
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="lazyOnload"
      onReady={() => setPhase(current => current === "reconciliation" ? current : "ready")}
      onError={() => {
        setPhase(current => current === "reconciliation" ? current : "loading");
        showError("Secure checkout could not load. Please refresh and try again.");
      }}
    />
    <form className="v2-premium-form v2-donation-form" onSubmit={submit} aria-busy={busy} aria-labelledby="donation-form-heading" aria-describedby="donation-form-description donation-checkout-status">
      <div className="v2-form-heading"><span>Secure contribution</span><h2 id="donation-form-heading">Choose how you would like to support.</h2><p id="donation-form-description">Only the information needed to process and acknowledge your contribution is requested.</p></div>
      <p id="donation-checkout-status" className={styles.status} role="status" aria-live="polite">{statusText}</p>
      {error && <div ref={errorRef} className="form-error" role="alert" aria-live="assertive" tabIndex={-1}>{error}</div>}
      <div className="form-grid">
        <div className={`field full v2-amount-field ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="amount">Donation amount <span>INR</span></label><div className={`${styles.checkoutControl} ${styles.amountControl}`}><b aria-hidden="true">₹</b><input id="amount" name="amount" type="number" min={transactionMin} max={transactionMax} step="1" inputMode="numeric" placeholder="Enter amount" required disabled={lockedForReconciliation}/></div><small className={styles.hint}>{transactionMax < 10 ? `₹${transactionMax.toLocaleString("en-IN")} is the exact amount remaining to complete this appeal.` : `Maximum available for this transaction: ₹${transactionMax.toLocaleString("en-IN")}.`}</small></div>
        <div className={`field ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="donorName">Full name</label><div className={styles.checkoutControl}><input id="donorName" name="donorName" autoComplete="name" minLength={2} required disabled={lockedForReconciliation}/></div></div>
        <div className={`field ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="donorEmail">Email</label><div className={styles.checkoutControl}><input id="donorEmail" name="donorEmail" type="email" autoComplete="email" required disabled={lockedForReconciliation}/></div></div>
        <div className={`field full ${styles.checkoutShell}`}><label className={styles.checkoutLabel} htmlFor="donorPhone">Phone <span className="muted">optional</span></label><div className={styles.checkoutControl}><input id="donorPhone" name="donorPhone" type="tel" autoComplete="tel" disabled={lockedForReconciliation}/></div></div>
        <fieldset className={`field full ${styles.intentGroup}`} disabled={lockedForReconciliation}>
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
          <small className={styles.intentNote}>{zakatEligible ? "Amaana has explicitly reviewed this appeal as Zakat-eligible. Your selection records your giving intention; it does not alter the underlying verification record." : "Zakat is shown only on appeals that Amaana has explicitly reviewed as Zakat-eligible."}</small>
        </fieldset>
        <div className={`field full v2-form-choice ${styles.choice}`}><label className="checkbox"><input name="isAnonymous" type="checkbox" disabled={lockedForReconciliation}/><span><strong>Keep my public identity private</strong><small>Do not show my name in any public donor listing.</small></span></label></div>
        <div className={`field full v2-form-choice ${styles.choice}`}><label className="checkbox"><input name="domesticConfirmed" type="checkbox" required disabled={lockedForReconciliation}/><span><strong>Domestic contribution confirmation</strong><small>I confirm this donation is from an Indian source using a domestic payment method.</small></span></label></div>
        <div className="field full v2-form-submit"><button className="v2-button" type="submit" disabled={busy || !scriptReady || lockedForReconciliation}>{phase === "opening" ? "Opening secure checkout…" : phase === "verifying" ? "Verifying donation…" : phase === "reconciliation" ? "Verification follow-up required" : scriptReady ? "Continue securely →" : "Preparing secure checkout…"}</button><small>{lockedForReconciliation ? "Do not submit another payment for this donation. Keep your Razorpay confirmation so the payment can be reconciled safely." : "Next: Razorpay secure checkout. Your Amaana acknowledgement follows successful payment verification and is not an 80G tax-deduction certificate."}</small></div>
      </div>
    </form>
  </>;
}
