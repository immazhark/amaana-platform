"use client";

import { useState } from "react";

type AppealShareProps = {
  title: string;
  summary: string;
  path: string;
};

export function AppealShare({ title, summary, path }: AppealShareProps) {
  const [status, setStatus] = useState("");
  // The same absolute URL is rendered on the server and during hydration.
  // Invalid preview configuration must not crash the sharing controls.
  let canonicalUrl: string;
  try {
    canonicalUrl = new URL(path, process.env.NEXT_PUBLIC_APP_URL || "https://amaanafoundation.org").toString();
  } catch {
    canonicalUrl = new URL(path, "https://amaanafoundation.org").toString();
  }
  const whatsappMessage = [title, summary, canonicalUrl].filter(Boolean).join("\n\n");
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  async function share() {
    setStatus("");
    try {
      if (navigator.share) {
        await navigator.share({ title, text: summary, url: canonicalUrl });
        setStatus("Share options opened.");
        return;
      }
      await navigator.clipboard.writeText(canonicalUrl);
      setStatus("Appeal link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("Could not share automatically. Copy the page address from your browser.");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setStatus("Appeal link copied.");
    } catch {
      setStatus("Could not copy automatically. Copy the page address from your browser.");
    }
  }

  return (
    <div className="v2-appeal-share" role="group" aria-label="Share this appeal">
      <div>
        <span className="v2-section-label">Share responsibly</span>
        <p>Help this verified appeal reach someone who may be able to support it.</p>
      </div>
      <div className="v2-appeal-share-actions">
        <button type="button" className="v2-text-link" onClick={share}>Share appeal ↗</button>
        <a className="v2-text-link" href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>
        <button type="button" className="v2-text-link" onClick={copy}>Copy link</button>
      </div>
      <p className="v2-appeal-share-status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
