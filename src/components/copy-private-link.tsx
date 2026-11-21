"use client";

import { useState } from "react";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";

/** The private token is removed from the address bar as soon as the record opens, so a donor can only keep the link by
 * copying it on purpose. Copying happens on click only. The link is a key to the record, so the warning travels with it. */
export function CopyPrivateLinkButton({ reference, getToken }: { reference: string; getToken: () => string | null }) {
  const [message, setMessage] = useState("");

  async function copy() {
    const token = getToken();
    if (!token) {
      setMessage("This link cannot be copied from here. Use the original link you were given.");
      return;
    }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${privateDonationAcknowledgementPath(reference, token)}`);
      setMessage("Private link copied. Anyone with this link can open this record, so keep it somewhere safe.");
    } catch {
      setMessage("Your browser did not allow copying. Print or save this page as a PDF instead.");
    }
  }

  return (
    <div className="v2-receipt-copy print-button">
      <button className="button secondary" type="button" onClick={copy}>Copy private link</button>
      <p role="status">{message || "Anyone with this link can open this record. Copy it only to somewhere private."}</p>
    </div>
  );
}
