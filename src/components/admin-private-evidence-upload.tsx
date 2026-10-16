"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { boundedPrivateRequest } from "@/lib/bounded-private-request";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = { caseId: string; purpose?: "delivery" | "financial" | "consent" };
export function AdminPrivateEvidenceUpload({ caseId, purpose = "delivery" }: Props) {
  return <EvidenceUpload key={`${caseId}:${purpose}`} caseId={caseId} purpose={purpose}/>;
}

function EvidenceUpload({ caseId, purpose = "delivery" }: Props) {
  const router = useRouter();
  const financial = purpose === "financial";
  const consent = purpose === "consent";
  const fieldId = financial ? "case-financial-proof"
    : consent ? "case-outcome-consent" : "case-delivery-evidence";
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const locked = useRef(false);
  const lifetime = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => { controller.abort(); lifetime.current = null; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || uncertain) return;
    const body = new FormData(event.currentTarget);
    const entry = body.get("document");
    if (!(entry instanceof File) || entry.size === 0 || entry.size > MAX_BYTES) {
      setError(true);
      setMessage("Choose one non-empty PDF or image, 5 MB or smaller.");
      return;
    }
    const controller = lifetime.current;
    if (!controller || controller.signal.aborted) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    setMessage("Uploading to private case storage…");
    let uncertainOutcome = false;
    try {
      const { response, result } = await boundedPrivateRequest(async signal => {
        const response = await fetch(`/api/admin/assistance/${encodeURIComponent(caseId)}/documents`, {
          method: "POST", body, cache: "no-store", credentials: "same-origin", signal,
        });
        const result: unknown = await response.json();
        return { response, result };
      }, 30_000, controller.signal);
      if (controller.signal.aborted) return;
      if (!response.ok) {
        // A server failure can follow a committed object/database write.
        if (response.status >= 500) throw new Error("Upload confirmation unavailable");
        const detail = typeof result === "object" && result !== null &&
          "error" in result && typeof result.error === "string"
          ? result.error.slice(0, 200) : "Upload failed. Review the case before trying again.";
        setError(true);
        setMessage(detail);
        return;
      }
      if (typeof result !== "object" || result === null || !("documentId" in result) ||
          typeof result.documentId !== "string" || !/^[a-zA-Z0-9_-]{3,128}$/.test(result.documentId)) {
        throw new Error("Upload receipt missing");
      }
      formRef.current?.reset();
      const confirmation = financial
        ? "Private bank proof uploaded. Refresh and select it for the financial corroboration proposal."
        : consent ? "Private consent document uploaded. Independently review its exact scope before proposing anonymous copy."
        : "Private evidence uploaded. Select the new document in the delivery report below to link it for review.";
      setMessage(confirmation);
      try { router.refresh(); }
      catch { setMessage(`${confirmation} The view refresh failed; reload the case to see the document.`); }
    } catch {
      if (controller.signal.aborted) return;
      uncertainOutcome = true;
      setUncertain(true);
      setError(true);
      setMessage("Upload confirmation was interrupted. The file may already be stored. Reload the case and review its documents before uploading again.");
    } finally {
      if (!controller.signal.aborted) {
        locked.current = uncertainOutcome;
        setBusy(false);
      }
    }
  }

  return <form ref={formRef} className="field" onSubmit={submit}
    encType="multipart/form-data" aria-label={financial ? "Upload private bank proof" : consent ? "Upload exact-copy consent evidence" : "Upload private delivery evidence"}>
    <input type="hidden" name="purpose" value={purpose}/>
    <label htmlFor={fieldId}>{financial ? "Upload supporting bank transaction proof" : consent ? "Upload signed consent for the exact anonymous wording" : "Upload new private delivery proof"}</label>
    <input id={fieldId} name="document" type="file"
      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
      required disabled={busy || uncertain}/>
    <small className="muted">One PDF, JPEG, PNG or WebP, up to 5 MB.
      Private evidence is not published or sent to donors. Upload first, then link
      {financial ? " bank proof to an independently confirmed financial delivery." :
        consent ? " signed, specific consent to the exact proposed anonymous copy; uploading alone does not approve disclosure." :
        " the document to an unreviewed delivery record."}</small>
    <button className="button secondary" type="submit" disabled={busy || uncertain}
      aria-busy={busy}>{busy ? "Uploading…" : "Upload private proof"}</button>
    <p role={error ? "alert" : "status"} aria-live="polite" className="muted">{message}</p>
    {uncertain && <a href={`/admin/requests/${encodeURIComponent(caseId)}`}>Reload case and review private documents</a>}
  </form>;
}
