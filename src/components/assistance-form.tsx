"use client";

import { useRouter } from "next/navigation";
import Link from "@/components/navigation-link";
import { type FormEvent, type InputHTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";
import { DonationInputField } from "./donation-input-field";
import { privateTrackingPath } from "@/lib/private-tracking";
import { boundedPrivateRequest } from "@/lib/bounded-private-request";
import { assistanceDocumentSelectionIssue } from "@/lib/assistance-document-selection";
import { ASSISTANCE_FIELDS, classifyAssistanceResponse, UNCERTAIN_ASSISTANCE_MESSAGE, type AssistanceField, type AssistanceFieldErrors } from "@/lib/assistance-feedback";
import styles from "./assistance-form.module.css";

type AssistanceStep = 1 | 2 | 3 | 4;
const fieldStep: Record<AssistanceField, AssistanceStep> = {
  applicantName: 1, phone: 1, email: 1, city: 1,
  category: 2, description: 2,
  documents: 3, consent: 4,
};
const stepLabels = ["Contact", "Need", "Evidence", "Confirm"] as const;

export function AssistanceForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<AssistanceStep>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<AssistanceStep>(1);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AssistanceFieldErrors>({});
  const [phase, setPhase] = useState<"ready" | "submitting" | "submitted" | "followup">("ready");
  const submissionLocked = useRef(false);
  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => () => { inFlight.current?.abort(); }, []);
  const [focusTarget, setFocusTarget] = useState<AssistanceField | AssistanceStep | "summary" | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ count: number; names: string[] }>({ count: 0, names: [] });
  const submitting = phase === "submitting";
  const locked = phase !== "ready";

  useEffect(() => {
    if (focusTarget === null) return;
    const frame = requestAnimationFrame(() => {
      const target = focusTarget === "summary" ? errorRef.current
        : typeof focusTarget === "number" ? formRef.current?.querySelector<HTMLElement>(`[data-assistance-step="${focusTarget}"]`)
        : formRef.current?.elements.namedItem(focusTarget);
      if (target instanceof HTMLElement) target.focus();
      setFocusTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTarget, step, phase, fieldErrors]);

  function clearFieldError(field: AssistanceField) { setFieldErrors(current => current[field] ? { ...current, [field]: undefined } : current); }
  function firstFieldError(field: AssistanceField) { return fieldErrors[field]?.[0]; }

  function fieldProps(field: AssistanceField, hint?: string) {
    const message = firstFieldError(field);
    return { "aria-invalid": Boolean(message) || undefined,
      "aria-describedby": message ? [hint, `${field === "applicantName" ? "name" : field}-error`].filter(Boolean).join(" ") : hint,
      onChange: () => clearFieldError(field) };
  }

  function fieldError(field: AssistanceField) {
    const message = firstFieldError(field);
    return message ? <small id={`${field}-error`} className="v2-field-error">{message}</small> : null;
  }

  function contactField(field: AssistanceField, id: string, label: ReactNode, input: InputHTMLAttributes<HTMLInputElement>) {
    const message = firstFieldError(field);
    return <DonationInputField label={label} error={message} errorId={`${id}-error`}
      input={{ ...input, id, name: field, ...fieldProps(field) }} />;
  }

  function goToStep(target: AssistanceStep) {
    if (submissionLocked.current) return;
    setStep(target);
    setMaxVisitedStep(current => Math.max(current, target) as AssistanceStep);
    setFocusTarget(target);
  }

  function navigateToStep(target: AssistanceStep) {
    if (target > step && !validateStep(step)) return;
    goToStep(target);
  }

  function validateFields(form: HTMLFormElement, current?: AssistanceStep) {
    const invalid = ASSISTANCE_FIELDS.map(field => ({ field, control: form.elements.namedItem(field) }))
      .find(({ field, control }) => (!current || fieldStep[field] === current) &&
        (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) && !control.checkValidity());
    if (!invalid) return true;
    const target = fieldStep[invalid.field];
    setStep(target);
    setMaxVisitedStep(visited => Math.max(visited, target) as AssistanceStep);
    const control = invalid.control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    setFieldErrors(errors => ({ ...errors, [invalid.field]: [control.validationMessage || "Please check this field."] }));
    setFocusTarget(invalid.field);
    return false;
  }

  function validateStep(current: AssistanceStep) {
    return formRef.current ? validateFields(formRef.current, current) : false;
  }

  function advance() {
    if (!validateStep(step) || step >= 4) return;
    goToStep((step + 1) as AssistanceStep);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLocked.current) return;
    const form = event.currentTarget;
    setError("");
    setFieldErrors({});

    if (!validateFields(form)) return;

    const values = new FormData(form);
    const requestLifetime = new AbortController();
    inFlight.current = requestLifetime;
    submissionLocked.current = true;
    setPhase("submitting");
    try {
      // Bound both the upload and response decoding. A timeout never proves
      // that the server failed to write the case: do not retry automatically.
      const response = await boundedPrivateRequest(async signal => {
        const result = await fetch("/api/assistance", {
          method: "POST", body: values, signal,
        });
        return { status: result.status, payload: await result.json() };
      }, 120_000, requestLifetime.signal);
      if (requestLifetime.signal.aborted) return;
      const result = classifyAssistanceResponse(response.status, response.payload);
      if (result.kind === "rejected") {
        submissionLocked.current = false;
        setPhase("ready");
        setFieldErrors(result.fields);
        // File evidence rejected by the server must be replaced before any
        // new submission. Merely navigating back through steps is not a fix.
        const documents = form.elements.namedItem("documents");
        if (documents instanceof HTMLInputElement && result.fields.documents?.[0]) {
          documents.setCustomValidity(result.fields.documents[0]);
        }
        setError(result.message);
        const firstInvalidField = ASSISTANCE_FIELDS.find(field => result.fields[field]?.length);
        if (firstInvalidField) {
          const targetStep = fieldStep[firstInvalidField];
          setStep(targetStep);
          setMaxVisitedStep(current => Math.max(current, targetStep) as AssistanceStep);
          setFocusTarget(firstInvalidField);
        } else {
          setFocusTarget("summary");
        }
        return;
      }
      if (result.kind === "accepted") {
        setPhase("submitted");
        router.push(privateTrackingPath("/request-assistance/received", { reference: result.referenceNumber, token: result.trackingToken }));
        return;
      }
    } catch {
      // Transport/JSON/navigation failures can follow a committed case write.
    } finally {
      if (inFlight.current === requestLifetime) inFlight.current = null;
    }
    // A navigated-away page must never publish a stale local error. The
    // server may still be completing an aborted HTTP submission.
    if (requestLifetime.signal.aborted) return;
    setPhase("followup");
    setError(UNCERTAIN_ASSISTANCE_MESSAGE);
    setFocusTarget("summary");
  }


  return <form ref={formRef} className={`v2-premium-form v2-assistance-form ${styles.form}`} onSubmit={submit} encType="multipart/form-data" noValidate aria-busy={submitting} aria-labelledby="assistance-form-heading" aria-describedby="assistance-form-description">
    <div className="v2-form-heading"><span>Private submission</span><h2 id="assistance-form-heading">Tell us about the request.</h2><p id="assistance-form-description">Fields marked as required help the team identify and review the request. Optional information can be left out.</p></div>
    <nav className={styles.progress} aria-label="Assistance request progress">
      <p aria-live="polite" aria-atomic="true"><strong>Step {step} of 4</strong><span>{stepLabels[step - 1]}</span></p>
      <ol>{stepLabels.map((label, index) => { const itemStep = (index + 1) as AssistanceStep; return <li key={label}><button type="button" onClick={() => navigateToStep(itemStep)} disabled={itemStep > maxVisitedStep || locked} aria-current={itemStep === step ? "step" : undefined} aria-controls={`assistance-step-${itemStep}`}><span>{String(itemStep).padStart(2, "0")}</span>{label}</button></li>; })}</ol>
    </nav>
    {error && <div ref={errorRef} className="form-error" role="alert" aria-live="assertive" tabIndex={-1}>{error}{phase === "followup" && <p><Link className="v2-text-link" href="/contact">Contact Amaana about this request</Link></p>}</div>}
    <fieldset id="assistance-step-1" data-assistance-step="1" tabIndex={-1} hidden={step !== 1} disabled={locked}><legend><span>01</span> Contact</legend><div className="form-grid">
      {contactField("applicantName", "name", "Applicant name", { autoComplete: "name", minLength: 2, maxLength: 120, required: true })}
      {contactField("phone", "phone", "Phone number", { type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 18, pattern: "[+]?[0-9][0-9\\s-]{7,16}", required: true })}
      {contactField("email", "email", <>Email <span className="muted">optional</span></>, { type: "email", autoComplete: "email", maxLength: 254 })}
      {contactField("city", "city", "City", { autoComplete: "address-level2", required: true })}
    </div><div className={styles.stepActions}><button className="v2-button" type="button" onClick={advance}>Continue to need →</button></div></fieldset>
    <fieldset id="assistance-step-2" data-assistance-step="2" tabIndex={-1} hidden={step !== 2} disabled={locked}><legend><span>02</span> Need</legend><div className="form-grid">
      <div className="field full"><label htmlFor="category">Type of assistance</label><select id="category" name="category" required defaultValue="" {...fieldProps("category")}><option value="" disabled>Select the closest category</option><option value="MEDICAL">Medical</option><option value="EDUCATION">Education</option><option value="LIVELIHOOD">Livelihood</option><option value="FOOD_HARDSHIP">Food hardship</option><option value="HOUSING">Housing</option><option value="EMERGENCY">Emergency</option><option value="OTHER">Other</option></select>{fieldError("category")}</div>
      <div className="field full"><label htmlFor="description">Describe the need</label><textarea id="description" name="description" minLength={40} maxLength={5000} required placeholder="In your own words: what has happened, what support is needed, approximate amount if known, and anything time-sensitive." {...fieldProps("description", "description-help")} /><small id="description-help">40–5,000 characters. Please avoid unrelated sensitive information, passwords, OTPs or full banking credentials.</small>{fieldError("description")}</div>
    </div><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(1)}>← Back</button><button className="v2-button" type="button" onClick={advance}>Continue to evidence →</button></div></fieldset>
    <fieldset id="assistance-step-3" data-assistance-step="3" tabIndex={-1} hidden={step !== 3} disabled={locked}><legend><span>03</span> Supporting evidence <small>optional</small></legend><div className="form-grid"><div className="field full v2-file-field"><label className="v2-file-dropzone" htmlFor="documents"><strong>Add private supporting files</strong><span>PDF, JPG, PNG or WEBP · up to 5 files · maximum 5 MB each</span><span className="v2-file-cta">Choose files securely</span><span className="v2-file-selection" aria-live="polite">{selectedFiles.count ? `${selectedFiles.count} selected · ${selectedFiles.names.join(", ")}${selectedFiles.count > 5 ? ", …" : ""}` : "No files selected"}</span></label><input className="v2-file-input" id="documents" name="documents" type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple {...fieldProps("documents", "documents-help")} onChange={event => {
        const files = Array.from(event.currentTarget.files ?? []);
        const issue = assistanceDocumentSelectionIssue(files);
        event.currentTarget.setCustomValidity(issue ?? "");
        setSelectedFiles({ count: files.length, names: files.slice(0, 5).map(file => file.name) });
        setFieldErrors(current => ({ ...current, documents: issue ? [issue] : undefined }));
      }} /><small id="documents-help">Documents are used for private verification and administration. Uploading a document does not give Amaana permission to publish it.</small>{fieldError("documents")}</div></div><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(2)}>← Back</button><button className="v2-button" type="button" onClick={advance}>Continue to confirm →</button></div></fieldset>
    <fieldset id="assistance-step-4" data-assistance-step="4" tabIndex={-1} hidden={step !== 4} disabled={locked} className="v2-consent-fieldset"><legend><span>04</span> Confirm</legend><p className={styles.privacyNote}>Your request and supporting documents remain private by default. Public use of identity, photographs or sensitive circumstances is a separate reviewed decision.</p><div className="field full v2-form-choice"><label className="checkbox"><input name="consent" type="checkbox" required {...fieldProps("consent", "assistance-consent-help")} /><span><strong>I confirm the information I have provided is accurate to the best of my knowledge.</strong><small id="assistance-consent-help">I understand that submission does not guarantee assistance or public fundraising, and that Amaana may request further information to verify the need. Public use of a name, photograph or sensitive story details requires a separate decision and consent review.</small></span></label>{fieldError("consent")}</div><p className="muted">Before submitting, please review the <a href="/terms" target="_blank" rel="noreferrer">assistance and platform terms</a> and <a href="/privacy" target="_blank" rel="noreferrer">privacy notice</a>.</p><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(3)} disabled={locked}>← Back</button></div></fieldset>
    {step === 4 ? <div className="v2-form-submit"><button className="v2-button" type="submit" disabled={locked}>{submitting ? "Submitting securely…" : phase === "followup" ? "Request follow-up required" : phase === "submitted" ? "Request submitted" : "Submit private request →"}</button><small aria-live="polite">{submitting ? "Your private request is being submitted. Please do not close this page." : phase === "followup" ? "Contact Amaana before resubmitting." : "After successful submission, keep the private reference and tracking link shown on the confirmation page."}</small></div> : null}
  </form>;
}
