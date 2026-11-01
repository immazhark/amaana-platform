"use client";

import { useRef, useState } from "react";

type AppealShareProps = { title: string; summary: string; path: string };
type ShareData = { title: string; summary: string; url: string };

const copyError = "Copy unavailable. Select the URL below.";

export async function runAppealShare(
  { title, summary, url }: ShareData,
  action: "share" | "copy",
): Promise<string> {
  if (action === "share" && navigator.share) {
    try {
      await navigator.share({ title, text: summary, url });
      return "Share completed.";
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return "";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Link copied.";
  } catch {
    return copyError;
  }
}

export function AppealShare({ title, summary, path }: AppealShareProps) {
  const [status, setStatus] = useState("");
  const actionId = useRef(0);
  const canonicalUrl = `https://amaanafoundation.org${path[0] === "/" && path[1] !== "/" ? path : "/"}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${summary}\n\n${canonicalUrl}`)}`;

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
        <p>Help someone support this verified appeal.</p>
      </div>
      <div className="v2-appeal-share-actions">
        <button type="button" className="v2-text-link" onClick={() => void act("share")}>Share appeal ↗</button>
        <a className="v2-text-link" href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => { actionId.current++; setStatus(""); }}>WhatsApp ↗ <span className="sr-only">(opens in a new tab)</span></a>
        <button type="button" className="v2-text-link" onClick={() => void act("copy")}>Copy link</button>
      </div>
      <p className="v2-appeal-share-status" role="status">{status}</p>
      {status === copyError && (
        <input readOnly aria-label="Appeal URL to copy manually"
          value={canonicalUrl} onFocus={event => event.currentTarget.select()}
          style={{ width: "100%" }}/>
      )}
    </div>
  );
}
