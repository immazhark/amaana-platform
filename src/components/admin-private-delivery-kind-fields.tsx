"use client";

import { useState } from "react";

/** The server action is authoritative; these controls provide clear,
 * accessible client-side validation before a private delivery is submitted. */
export function AdminPrivateDeliveryKindFields() {
  const [kind, setKind] = useState<"IN_KIND" | "FINANCIAL">("IN_KIND");
  const [amount, setAmount] = useState("");
  const financial = kind === "FINANCIAL";

  return (
    <>
      <label htmlFor="support-kind">Actual support type</label>
      <select
        id="support-kind"
        name="kind"
        required
        value={kind}
        onChange={event => {
          const next = event.currentTarget.value;
          if (next !== "IN_KIND" && next !== "FINANCIAL") return;
          setKind(next);
          if (next === "IN_KIND") setAmount("");
        }}
      >
        <option value="IN_KIND">Goods or services (no invented cash value)</option>
        <option value="FINANCIAL">Financial support (actual INR amount required)</option>
      </select>
      <div hidden={!financial}>
        <label htmlFor="support-amount">Actual amount delivered in INR</label>
        <input
          id="support-amount"
          name="amountInr"
          type="number"
          step="0.01"
          min="0.01"
          max="9999999999.99"
          inputMode="decimal"
          value={financial ? amount : ""}
          required={financial}
          onChange={event => setAmount(event.currentTarget.value)}
        />
      </div>
      <p className="muted" aria-live="polite">
        {financial
          ? "Enter the actual delivered INR amount; a separate reviewer must confirm delivery evidence."
          : "In-kind goods and services must be recorded without an estimated cash value."}
      </p>
    </>
  );
}
