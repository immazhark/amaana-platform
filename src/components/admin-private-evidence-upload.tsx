"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = { caseId: string; purpose?: "delivery" | "financial" | "consent" };
export function AdminPrivateEvidenceUpload({ caseId, purpose = "delivery" }: Props) {
  const router = useRouter();
  const financial = purpose === "financial";
  const consent = purpose === "consent";
  const fieldId = financial ? "case-financial-proof"
    : consent ? "case-outcome-consent" : "case-delivery-evidence";
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const entry = new FormData(event.currentTarget).get("document");
    if (!(entry instanceof File) || entry.size === 0 || entry.size > MAX_BYTES) {
      setError(true);
      setMessage("Choose one non-empty PDF or image, 5 MB or smaller.");
      return;
    }
    setBusy(true);
    setError(false);
    setMessage("Uploading to private case storage…");
    try {
      const response = await fetch(`/api/admin/assistance/${encodeURIComponent(caseId)}/documents`, {
        method: "POST",
        body: new FormData(event.currentTarget),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const detail = typeof result === "object" && result !== null &&
          "error" in result && typeof result.error === "string"
          ? result.error : "Upload failed. Review the case before trying again.";
        setError(true);
        setMessage(detail);
        return;
      }
      formRef.current?.reset();
      setMessage(financial
        ? "Private bank proof uploaded. Refresh and select it for the financial corroboration proposal."
        : consent ? "Private consent document uploaded. Independently review its exact scope before proposing anonymous copy."
        : "Private evidence uploaded. Select the new document in the delivery report below to link it for review.");
      router.refresh();
    } catch {
      setError(true);
      setMessage("Upload confirmation was interrupted. Refresh the case before trying again to avoid duplicate evidence.");
    } finally {
      setBusy(false);
    }
  }

  return <form ref={formRef} className="field" onSubmit={submit}
    encType="multipart/form-data" aria-label={financial ? "Upload private bank proof" : consent ? "Upload exact-copy consent evidence" : "Upload private delivery evidence"}>
    <input type="hidden" name="purpose" value={purpose}/>
    <label htmlFor={fieldId}>{financial ? "Upload supporting bank transaction proof" : consent ? "Upload signed consent for the exact anonymous wording" : "Upload new private delivery proof"}</label>
    <input id={fieldId} name="document" type="file"
      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
      required disabled={busy}/>
    <small className="muted">One PDF, JPEG, PNG or WebP, up to 5 MB.
      Private evidence is not published or sent to donors. Upload first, then link
      {financial ? " bank proof to an independently confirmed financial delivery." :
        consent ? " signed, specific consent to the exact proposed anonymous copy; uploading alone does not approve disclosure." :
        " the document to an unreviewed delivery record."}</small>
    <button className="button secondary" type="submit" disabled={busy}
      aria-busy={busy}>{busy ? "Uploading…" : "Upload private proof"}</button>
    <p role={error ? "alert" : "status"} aria-live="polite" className="muted">{message}</p>
  </form>;
}
