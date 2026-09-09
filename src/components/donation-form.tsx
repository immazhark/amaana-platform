"use client";

import Script from "next/script";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email: string; contact?: string }; handler: (response: RazorpayResponse) => Promise<void>; modal: { ondismiss: () => void }; theme: { color: string } };
declare global { interface Window { Razorpay: new (options: RazorpayOptions) => { open(): void } } }

export function DonationForm({ appealId, appealTitle }: { appealId: string; appealTitle: string }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [scriptReady, setScriptReady] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!scriptReady || !window.Razorpay) { setError("Secure checkout is still loading. Please try again."); return; }
    setBusy(true); const values = new FormData(event.currentTarget);
    try {
      const orderResponse = await fetch("/api/donations/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appealId, donorName: values.get("donorName"), donorEmail: values.get("donorEmail"), donorPhone: values.get("donorPhone"), amount: values.get("amount"), isAnonymous: values.get("isAnonymous") === "on", domesticConfirmed: values.get("domesticConfirmed") === "on" }) });
      const order = await orderResponse.json(); if (!orderResponse.ok) throw new Error(order.error ?? "Could not start checkout");
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "Amaana Foundation", description: appealTitle, order_id: order.orderId, prefill: order.donor, theme: { color: "#116149" }, modal: { ondismiss: () => setBusy(false) }, handler: async payment => {
        const confirmation = await fetch("/api/donations/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payment, receiptToken: order.receiptToken }) });
        const result = await confirmation.json(); if (!confirmation.ok) { setError(result.error ?? "Payment verification is pending."); setBusy(false); return; }
        router.push(`/donations/${encodeURIComponent(result.referenceNumber)}/acknowledgement?token=${encodeURIComponent(order.receiptToken)}`);
      } });
      checkout.open();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not start checkout"); setBusy(false); }
  }
  return <><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)}/><form className="card form-card" onSubmit={submit}>{error && <div className="form-error" role="alert">{error}</div>}<div className="form-grid"><div className="field full"><label htmlFor="amount">Donation amount (₹)</label><input id="amount" name="amount" type="number" min="10" max="1000000" step="1" required/></div><div className="field"><label htmlFor="donorName">Full name</label><input id="donorName" name="donorName" autoComplete="name" minLength={2} required/></div><div className="field"><label htmlFor="donorEmail">Email</label><input id="donorEmail" name="donorEmail" type="email" autoComplete="email" required/></div><div className="field full"><label htmlFor="donorPhone">Phone <span className="muted">(optional)</span></label><input id="donorPhone" name="donorPhone" type="tel" autoComplete="tel"/></div><div className="field full"><label className="checkbox"><input name="isAnonymous" type="checkbox"/><span>Keep my name private on public donor listings</span></label></div><div className="field full"><label className="checkbox"><input name="domesticConfirmed" type="checkbox" required/><span>I confirm this donation is being made from an Indian source using a domestic payment method.</span></label></div><div className="field full"><button className="button" disabled={busy}>{busy ? "Opening secure checkout…" : "Continue to Razorpay"}</button><small className="muted">You will receive a normal donation acknowledgement. It is not an 80G tax-deduction certificate.</small></div></div></form></>;
}
