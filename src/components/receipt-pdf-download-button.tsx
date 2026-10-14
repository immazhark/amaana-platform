"use client";
import { useEffect, useRef, useState } from "react";

const MAX_PDF_BYTES = 2 * 1024 * 1024;
const referencePattern = /^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const grantPattern = /^rd1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Lazy, strictly opt-in PDF action. The existing private receipt credential
 * never enters URLs, analytics, component props or persisted browser state. */
export default function ReceiptPdfDownloadButton({ reference, getToken }: {
  reference: string;
  getToken: () => string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const locked = useRef(false);
  const objectUrl = useRef<string | null>(null);
  const revokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (revokeTimer.current) clearTimeout(revokeTimer.current);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  async function download() {
    if (locked.current) return;
    const token = getToken();
    if (!token || !referencePattern.test(reference)) { setFailed(true); return; }
    locked.current = true;
    setBusy(true);
    setFailed(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const headers = { "Content-Type": "application/json" };
      const authResponse = await fetch("/api/donations/receipt-download/authorize", {
        method: "POST", headers, credentials: "same-origin", cache: "no-store",
        body: JSON.stringify({ reference, token }), signal: controller.signal,
      });
      if (!authResponse.ok) throw new Error("PDF authorization unavailable");
      const result: unknown = await authResponse.json();
      if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("Invalid authorization");
      const grant = (result as Record<string, unknown>).grant;
      const ttl = (result as Record<string, unknown>).expiresInSeconds;
      if ((result as Record<string, unknown>).available !== true ||
          typeof grant !== "string" || grant.length > 1400 ||
          !grantPattern.test(grant) || ttl !== 300) throw new Error("Invalid authorization");

      const pdfResponse = await fetch("/api/donations/receipt-download/redeem", {
        method: "POST", headers, credentials: "same-origin", cache: "no-store",
        body: JSON.stringify({ grant }), signal: controller.signal,
      });
      if (!pdfResponse.ok ||
          pdfResponse.headers.get("content-type")?.split(";")[0].trim() !== "application/pdf" ||
          !/attachment/i.test(pdfResponse.headers.get("content-disposition") ?? "")) {
        throw new Error("Secure PDF unavailable");
      }
      const declared = Number(pdfResponse.headers.get("content-length"));
      if (!Number.isFinite(declared) || declared > MAX_PDF_BYTES) throw new Error("PDF exceeds allowed size");
      const bytes = await pdfResponse.arrayBuffer();
      if (bytes.byteLength < 16 || bytes.byteLength > MAX_PDF_BYTES) throw new Error("Invalid PDF");
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      objectUrl.current = url;
      const link = document.createElement("a");
      link.href = url;
      link.download = `amaana-acknowledgement-${reference}.pdf`;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); }
      if (revokeTimer.current) clearTimeout(revokeTimer.current);
      revokeTimer.current = setTimeout(() => {
        URL.revokeObjectURL(url);
        if (objectUrl.current === url) objectUrl.current = null;
      }, 60_000);
    } catch {
      setFailed(true);
    } finally {
      clearTimeout(timeout);
      locked.current = false;
      setBusy(false);
    }
  }

  return <span className="v2-private-pdf-download">
    <button type="button" className="button secondary print-button"
      disabled={busy} aria-busy={busy} onClick={() => { void download(); }}>
      {busy ? "Preparing private PDF…" : "Download acknowledgement (PDF)"}
    </button>
    {failed && <span role="status">PDF unavailable. Use Print or save as PDF instead. You do not need to make another payment.</span>}
  </span>;
}
