"use client";

import Script from "next/script";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email: string; contact?: string }; handler: (response: RazorpayResponse) => Promise<void>; modal: { ondismiss: () => void }; theme: { color: string } };
type CheckoutPhase = "loading" | "ready" | "opening" | "verifying";
declare global { interface Window { Razorpay: new (options: RazorpayOptions) => { open(): void } } }

export function DonationForm({ appealId, appealTitle }: { appealId: string; appealTitle: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("loading");

  const busy = phase === "opening" || phase === "verifying";
  const scriptReady = phase !== "loading";
  const statusText = phase === "loading"
    ? "Preparing secure checkout."
    : phase === "opening"
      ? "Opening Razorpay secure checkout."
      : phase === "verifying"
        ? "Payment received. Verifying your donation with Amaana."
        : "Secure checkout is ready.";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!scriptReady || !window.Razorpay) {
      setError("Secure checkout is still loading. Please try again.");
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
          const confirmation = await fetch("/api/donations/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payment, receiptToken: order.receiptToken }),
          });
          const result = await confirmation.json();
          if (!confirmation.ok) {
            setError(result.error ?? "Payment verification is pending.");
            setPhase("ready");
            return;
          }
          router.push(`/donations/${encodeURIComponent(result.referenceNumber)}/acknowledgement?token=${encodeURIComponent(order.receiptToken)}`);
        },
      });
      checkout.open();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start checkout");
      setPhase("ready");
    }
  }

  return <>
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="lazyOnload"
      onLoad={() => setPhase("ready")}
      onError={() => {
        setPhase("loading");
        setError("Secure checkout could not load. Please refresh and try again.");
      }}
    />
    <form className="v2-premium-form v2-donation-form" onSubmit={submit} aria-busy={busy} aria-describedby="donation-form-description donation-checkout-status">
      <div className="v2-form-heading"><span>Secure contribution</span><h2 id="donation-form-heading">Choose how you would like to support.</h2><p id="donation-form-description">Only the information needed to process and acknowledge your contribution is requested.</p></div>
      <p id="donation-checkout-status" className="muted" role="status" aria-live="polite">{statusText}</p>
      {error && <div className="form-error" role="alert" aria-live="assertive">{error}</div>}
      <div className="form-grid">
        <div className="field full v2-amount-field"><label htmlFor="amount">Donation amount <span>INR</span></label><div className="v2-amount-input"><b aria-hidden="true">₹</b><input id="amount" name="amount" type="number" min="10" max="1000000" step="1" inputMode="numeric" placeholder="Enter amount" required/></div></div>
        <div className="field"><label htmlFor="donorName">Full name</label><input id="donorName" name="donorName" autoComplete="name" minLength={2} required/></div>
        <div className="field"><label htmlFor="donorEmail">Email</label><input id="donorEmail" name="donorEmail" type="email" autoComplete="email" required/></div>
        <div className="field full"><label htmlFor="donorPhone">Phone <span className="muted">optional</span></label><input id="donorPhone" name="donorPhone" type="tel" autoComplete="tel"/></div>
        <div className="field full v2-form-choice"><label className="checkbox"><input name="isAnonymous" type="checkbox"/><span><strong>Keep my public identity private</strong><small>Do not show my name in any public donor listing.</small></span></label></div>
        <div className="field full v2-form-choice"><label className="checkbox"><input name="domesticConfirmed" type="checkbox" required/><span><strong>Domestic contribution confirmation</strong><small>I confirm this donation is from an Indian source using a domestic payment method.</small></span></label></div>
        <div className="field full v2-form-submit"><button className="v2-button" type="submit" disabled={busy || !scriptReady}>{phase === "opening" ? "Opening secure checkout…" : phase === "verifying" ? "Verifying donation…" : scriptReady ? "Continue securely →" : "Preparing secure checkout…"}</button><small>Next: Razorpay secure checkout. Your Amaana acknowledgement follows successful payment verification and is not an 80G tax-deduction certificate.</small></div>
      </div>
    </form>
  </>;
}
