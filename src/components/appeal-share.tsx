"use client";

import { useEffect, useRef, useState } from "react";
import { CopyIcon, MessageIcon, ShareIcon } from "./donation-interface-icons";
import styles from "./appeal-share.module.css";

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
  const canonicalUrl = `https://amaanafoundation.org${path[0] === "/" && path[1] !== "/" ? path : "/"}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${summary}\n\n${canonicalUrl}`)}`;
  const identity = JSON.stringify([title, summary, canonicalUrl]);
  const actionId = useRef(0);
  const [feedback, setFeedback] = useState(() => ({ identity, token: {}, message: "" }));
  let currentFeedback = feedback;
  // Reset retained component state before rendering a different appeal.
  if (feedback.identity !== identity) {
    currentFeedback = { identity, token: {}, message: "" };
    setFeedback(currentFeedback);
  }
  const token = currentFeedback.token;
  const status = currentFeedback.message;

  useEffect(() => () => { actionId.current++; }, []);

  function updateStatus(message: string) {
    setFeedback(current => current.token === token ? { ...current, message } : current);
  }

  async function act(action: "share" | "copy") {
    const id = ++actionId.current;
    updateStatus("");
    const result = await runAppealShare({ title, summary, url: canonicalUrl }, action);
    if (id === actionId.current) updateStatus(result);
  }

  return (
    <div className={`v2-appeal-share ${styles.card}`} role="group" aria-label="Share this appeal">
      <div className={styles.intro}>
        <span className="v2-section-label">Share responsibly</span>
        <p>Help someone support this verified appeal.</p>
      </div>
      <div className={`v2-appeal-share-actions ${styles.actions}`}>
        <button type="button" className={styles.action} onClick={() => void act("share")}><ShareIcon/><span>Share appeal</span></button>
        <a className={styles.action} href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => { actionId.current++; updateStatus(""); }}><MessageIcon/><span>WhatsApp</span><span className="sr-only">(opens in a new tab)</span></a>
        <button type="button" className={styles.action} onClick={() => void act("copy")}><CopyIcon/><span>Copy link</span></button>
      </div>
      <p className={`v2-appeal-share-status ${styles.status}`} role="status" aria-live="polite">{status}</p>
      {status === copyError && (
        <input readOnly aria-label="Appeal URL to copy manually" className={styles.fallback}
          value={canonicalUrl} onFocus={event => event.currentTarget.select()}/>
      )}
    </div>
  );
}
