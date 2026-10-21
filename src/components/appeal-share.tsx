"use client";

import { useRef, useState } from "react";

type AppealShareProps = { title: string; summary: string; path: string };
type ShareData = { title: string; summary: string; url: string };

const copyError = "Automatic copying is unavailable. Select and copy the appeal URL below.";

export async function runAppealShare(
  { title, summary, url }: ShareData,
  action: "share" | "copy",
): Promise<string> {
  if (action === "share" && navigator.share) {
    try {
      await navigator.share({ title, text: summary, url });
      return "Share request completed.";
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return "";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Appeal link copied.";
  } catch {
    return copyError;
  }
}

export function AppealShare({ title, summary, path }: AppealShareProps) {
  const [status, setStatus] = useState("");
  const actionId = useRef(0);
  const canonicalUrl = `https://amaanafoundation.org${path.startsWith("/") && !path.startsWith("//") ? path : "/"}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent([title, summary, canonicalUrl].filter(Boolean).join("\n\n"))}`;

  async function act(action: "share" | "copy") {
    const id = ++actionId.current;
    setStatus("");
    const result = await runAppealShare({ title, summary, url: canonicalUrl }, action);
    if (id === actionId.current) setStatus(result);
  }

  return (
    <div className="v2-appeal-share" role="group" aria-label="Share this appeal">
      <div>
        <span className="v2-section-label">Share responsibly</span>
        <p>Help this verified appeal reach someone who may be able to support it.</p>
      </div>
      <div className="v2-appeal-share-actions">
        <button type="button" className="v2-text-link" onClick={() => void act("share")}>Share appeal ↗</button>
        <a className="v2-text-link" href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => { actionId.current++; setStatus(""); }}>WhatsApp ↗</a>
        <button type="button" className="v2-text-link" onClick={() => void act("copy")}>Copy link</button>
      </div>
      <p className="v2-appeal-share-status" role="status" aria-live="polite">{status}</p>
      {status === copyError && (
        <input type="text" readOnly aria-label="Appeal URL to copy manually"
          value={canonicalUrl} onFocus={event => event.currentTarget.select()}
          style={{ width: "100%", maxWidth: "100%" }}/>
      )}
    </div>
  );
}
