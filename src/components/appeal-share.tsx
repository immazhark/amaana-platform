"use client";

import { useRef, useState } from "react";

type AppealShareProps = {
  title: string;
  summary: string;
  path: string;
};

type ShareData = { title: string; summary: string; url: string };
type ShareOutcome = "shared" | "copied" | "manual" | "cancelled";

/** Use clipboard fallback when native sharing is unavailable or rejects. */
export async function runAppealShare(data: ShareData, action: "share" | "copy"): Promise<ShareOutcome> {
  if (action === "share" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: data.title, text: data.summary, url: data.url });
      return "shared";
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    if (typeof navigator.clipboard?.writeText !== "function") return "manual";
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "manual";
  }
}

export function AppealShare({ title, summary, path }: AppealShareProps) {
  const [feedback, setFeedback] = useState<"idle" | "shared" | "copied" | "manual" | "whatsapp">("idle");
  const actionId = useRef(0);
  // Render an identical canonical URL on the server and on the client.
  const canonicalUrl = `https://amaanafoundation.org${path.startsWith("/") && !path.startsWith("//") ? path : "/"}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent([title, summary, canonicalUrl].filter(Boolean).join("\n\n"))}`;

  async function act(action: "share" | "copy") {
    const currentId = ++actionId.current;
    setFeedback("idle");
    const outcome = await runAppealShare({ title, summary, url: canonicalUrl }, action);
    // Earlier clipboard or native-share promises must not overwrite newer feedback.
    if (actionId.current === currentId && outcome !== "cancelled") setFeedback(outcome);
  }

  return (
    <div className="v2-appeal-share" role="group" aria-label="Share this appeal">
      <div>
        <span className="v2-section-label">Share responsibly</span>
        <p>Help this verified appeal reach someone who may be able to support it.</p>
      </div>
      <div className="v2-appeal-share-actions">
        <button type="button" className="v2-text-link" onClick={() => void act("share")}>Share appeal ↗</button>
        <a
          className="v2-text-link"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { actionId.current += 1; setFeedback("whatsapp"); }}
        >WhatsApp ↗</a>
        <button type="button" className="v2-text-link" onClick={() => void act("copy")}>Copy link</button>
      </div>
      <p className="v2-appeal-share-status" role="status" aria-live="polite" aria-atomic="true">
        {feedback === "shared" ? "Share request completed." :
          feedback === "copied" ? "Appeal link copied." :
          feedback === "manual" ? "Automatic copying is unavailable. Select and copy the appeal URL below." :
          feedback === "whatsapp" ? "Choose a WhatsApp chat to send the appeal." : ""}
      </p>
      {feedback === "manual" && (
        <input
          type="text"
          readOnly
          aria-label="Appeal URL to copy manually"
          value={canonicalUrl}
          onFocus={event => event.currentTarget.select()}
          style={{ width: "100%", maxWidth: "100%" }}
        />
      )}
    </div>
  );
}
