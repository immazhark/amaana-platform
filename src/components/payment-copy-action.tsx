"use client";

import { useState } from "react";

export function PaymentCopyAction({ value, label, text = "Copy" }: { value: string; label: string; text?: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copied.`);
    } catch {
      setStatus(`Could not copy ${label.toLowerCase()}. Select the displayed value and copy it manually.`);
    }
  }
  return <><button type="button" className="v2-text-link" onClick={copy}>{text}</button><span role="status" aria-live="polite">{status ? ` ${status}` : ""}</span></>;
}
