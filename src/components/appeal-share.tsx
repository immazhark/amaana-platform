"use client";

import { useState } from "react";

type AppealShareProps = {
  title: string;
  summary: string;
  path: string;
};

export function AppealShare({ title, summary, path }: AppealShareProps) {
  const [status, setStatus] = useState("");
  const canonicalUrl = typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

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

  function shareOnWhatsApp() {
    const message = [title, summary, canonicalUrl].filter(Boolean).join("\n\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setStatus("WhatsApp share opened in a new tab.");
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
    <div className="v2-appeal-share" aria-label="Share this appeal">
      <div>
        <span className="v2-section-label">Share responsibly</span>
        <p>Help this verified appeal reach someone who may be able to support it.</p>
      </div>
      <div className="v2-appeal-share-actions">
        <button type="button" className="v2-text-link" onClick={share}>Share appeal ↗</button>
        <button type="button" className="v2-text-link" onClick={shareOnWhatsApp}>WhatsApp ↗</button>
        <button type="button" className="v2-text-link" onClick={copy}>Copy link</button>
      </div>
      <p className="v2-appeal-share-status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
