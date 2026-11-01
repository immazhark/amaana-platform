"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { privateTrackingPath } from "@/lib/private-tracking";
import { assistanceDocumentSelectionIssue } from "@/lib/assistance-document-selection";
import { ASSISTANCE_FIELDS as assistanceFieldOrder, classifyAssistanceResponse, UNCERTAIN_ASSISTANCE_MESSAGE, type AssistanceField, type AssistanceFieldErrors as FieldErrors } from "@/lib/assistance-feedback";
import styles from "./assistance-form.module.css";

type AssistanceStep = 1 | 2 | 3 | 4;
const fieldStep: Record<AssistanceField, AssistanceStep> = {
  applicantName: 1, phone: 1, email: 1, city: 1,
  category: 2, description: 2,
  consent: 4,
};
const stepLabels = ["Contact", "Need", "Evidence", "Confirm"] as const;

type AssistanceCopy = {
  heading: ReactNode;
  descriptionHelp: ReactNode;
  evidenceInstructions: ReactNode;
  evidenceHelp: ReactNode;
  privacyNote: ReactNode;
  consentHelp: ReactNode;
  termsNotice: ReactNode;
};

export function AssistanceForm({ copy }: { copy: AssistanceCopy }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<AssistanceStep>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<AssistanceStep>(1);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<"ready" | "submitting" | "submitted" | "followup">("ready");
  const submissionLocked = useRef(false);
  const submitting = phase === "submitting";
  const locked = phase !== "ready";
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [documentError, setDocumentError] = useState<string | null>(null);

  function currentDocumentIssue() {
    const input = formRef.current?.elements.namedItem("documents");
    return input instanceof HTMLInputElement
      ? assistanceDocumentSelectionIssue(Array.from(input.files ?? []))
      : null;
  }

  function focusDocuments() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const input = formRef.current?.elements.namedItem("documents");
      if (input instanceof HTMLInputElement) input.focus();
    }));
  }

  function clearFieldError(field: AssistanceField) { setFieldErrors(current => current[field] ? { ...current, [field]: undefined } : current); }
  function firstFieldError(field: AssistanceField) { return fieldErrors[field]?.[0]; }
  function focusErrorSummary() { requestAnimationFrame(() => errorRef.current?.focus()); }

  function focusStep(target: AssistanceStep) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[data-assistance-step="${target}"]`)?.focus();
    }));
  }

  function goToStep(target: AssistanceStep) {
    if (submissionLocked.current) return;
    setStep(target);
    setMaxVisitedStep(current => Math.max(current, target) as AssistanceStep);
    focusStep(target);
  }

  function navigateToStep(target: AssistanceStep) {
    if (target > step && !validateStep(step)) return;
    goToStep(target);
  }

  function validateStep(current: AssistanceStep) {
    if (current === 3) {
      const issue = currentDocumentIssue();
      setDocumentError(issue);
      if (issue) {
        focusDocuments();
        return false;
      }
    }
    const fieldset = formRef.current?.querySelector<HTMLElement>(`[data-assistance-step="${current}"]`);
    if (!fieldset) return false;
    const controls = Array.from(fieldset.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
    const invalid = controls.find(control => !control.checkValidity());
    if (!invalid) return true;
    const field = invalid.name as AssistanceField;
    if (assistanceFieldOrder.includes(field)) {
      setFieldErrors(current => ({ ...current, [field]: [invalid.validationMessage || "Please check this field."] }));
    }
    // Let React render aria-invalid and the linked error before moving focus.
    // A native validity popup would compete with the persistent inline message.
    requestAnimationFrame(() => requestAnimationFrame(() => invalid.focus()));
    return false;
  }

  function advance() {
    if (submissionLocked.current || !validateStep(step) || step >= 4) return;
    goToStep((step + 1) as AssistanceStep);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLocked.current) return;
    const form = event.currentTarget;
    setError("");
    setFieldErrors({});

    const invalidControl = assistanceFieldOrder
      .map(field => ({ field, control: form.elements.namedItem(field) }))
      .find(({ control }) => control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement
        ? !control.checkValidity()
        : false);

    if (invalidControl) {
      const targetStep = fieldStep[invalidControl.field];
      setStep(targetStep);
      setMaxVisitedStep(current => Math.max(current, targetStep) as AssistanceStep);
      const controlForError = invalidControl.control;
      if (controlForError instanceof HTMLInputElement || controlForError instanceof HTMLSelectElement || controlForError instanceof HTMLTextAreaElement) {
        setFieldErrors({ [invalidControl.field]: [controlForError.validationMessage || "Please check this field."] });
      }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const control = form.elements.namedItem(invalidControl.field);
        if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
          control.focus();
        }
      }));
      return;
    }

    const issue = currentDocumentIssue();
    if (issue) {
      setDocumentError(issue);
      setStep(3);
      setMaxVisitedStep(current => Math.max(current, 3) as AssistanceStep);
      focusDocuments();
      return;
    }

    const values = new FormData(form);
    submissionLocked.current = true;
    setPhase("submitting");
    try {
      const response = await fetch("/api/assistance", { method: "POST", body: values });
      const result = classifyAssistanceResponse(response.status, await response.json());
      if (result.kind === "rejected") {
        const nextFieldErrors = result.fields;
        const message = result.message;
        setFieldErrors(nextFieldErrors);
        setError(message);
        submissionLocked.current = false;
        setPhase("ready");
        const firstInvalidField = assistanceFieldOrder.find(field => nextFieldErrors[field]?.length);
        if (firstInvalidField) {
          const targetStep = fieldStep[firstInvalidField];
          setStep(targetStep);
          setMaxVisitedStep(current => Math.max(current, targetStep) as AssistanceStep);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const control = form.elements.namedItem(firstInvalidField);
            if (control instanceof HTMLElement) control.focus();
          }));
        } else {
          focusErrorSummary();
        }
        return;
      }
      if (result.kind !== "accepted") throw new Error();
      setPhase("submitted");
      router.push(privateTrackingPath("/request-assistance/received", { reference: result.referenceNumber, token: result.trackingToken }));
    } catch {
      setError(UNCERTAIN_ASSISTANCE_MESSAGE);
      setPhase("followup");
      focusErrorSummary();
    }
  }

  const nameError = firstFieldError("applicantName"); const phoneError = firstFieldError("phone"); const emailError = firstFieldError("email"); const cityError = firstFieldError("city"); const categoryError = firstFieldError("category"); const descriptionError = firstFieldError("description"); const consentError = firstFieldError("consent");

  return <form ref={formRef} className={`v2-premium-form v2-assistance-form ${styles.form}`} onSubmit={submit} encType="multipart/form-data" noValidate aria-busy={submitting} aria-labelledby="assistance-form-heading" aria-describedby="assistance-form-description">
    {copy.heading}
    <nav className={styles.progress} aria-label="Assistance request progress">
      <p aria-live="polite" aria-atomic="true"><strong>Step {step} of 4</strong><span>{stepLabels[step - 1]}</span></p>
      <ol>{stepLabels.map((label, index) => { const itemStep = (index + 1) as AssistanceStep; return <li key={label}><button type="button" onClick={() => navigateToStep(itemStep)} disabled={itemStep > maxVisitedStep || locked} aria-current={itemStep === step ? "step" : undefined} aria-controls={`assistance-step-${itemStep}`}><span>{String(itemStep).padStart(2, "0")}</span>{label}</button></li>; })}</ol>
    </nav>
    {error && <div ref={errorRef} className="form-error" role="alert" aria-live="assertive" tabIndex={-1}>{error}{phase === "followup" && <p><a className="v2-text-link" href="/contact" target="_blank" rel="noreferrer">Contact Amaana about this request</a></p>}</div>}
    <fieldset id="assistance-step-1" data-assistance-step="1" tabIndex={-1} hidden={step !== 1} disabled={locked}><legend><span>01</span> Contact</legend><div className="form-grid">
      <div className="field"><label htmlFor="name">Applicant name</label><input id="name" name="applicantName" autoComplete="name" minLength={2} maxLength={120} required aria-invalid={Boolean(nameError) || undefined} aria-describedby={nameError ? "name-error" : undefined} onChange={() => clearFieldError("applicantName")} />{nameError && <small id="name-error" className="v2-field-error">{nameError}</small>}</div>
      <div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={Boolean(phoneError) || undefined} aria-describedby={phoneError ? "phone-error" : undefined} onChange={() => clearFieldError("phone")} />{phoneError && <small id="phone-error" className="v2-field-error">{phoneError}</small>}</div>
      <div className="field"><label htmlFor="email">Email <span className="muted">optional</span></label><input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(emailError) || undefined} aria-describedby={emailError ? "email-error" : undefined} onChange={() => clearFieldError("email")} />{emailError && <small id="email-error" className="v2-field-error">{emailError}</small>}</div>
      <div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required aria-invalid={Boolean(cityError) || undefined} aria-describedby={cityError ? "city-error" : undefined} onChange={() => clearFieldError("city")} />{cityError && <small id="city-error" className="v2-field-error">{cityError}</small>}</div>
    </div><div className={styles.stepActions}><button className="v2-button" type="button" onClick={advance}>Continue to need →</button></div></fieldset>
    <fieldset id="assistance-step-2" data-assistance-step="2" tabIndex={-1} hidden={step !== 2} disabled={locked}><legend><span>02</span> Need</legend><div className="form-grid">
      <div className="field full"><label htmlFor="category">Type of assistance</label><select id="category" name="category" required defaultValue="" aria-invalid={Boolean(categoryError) || undefined} aria-describedby={categoryError ? "category-error" : undefined} onChange={() => clearFieldError("category")}><option value="" disabled>Select the closest category</option><option value="MEDICAL">Medical</option><option value="EDUCATION">Education</option><option value="LIVELIHOOD">Livelihood</option><option value="FOOD_HARDSHIP">Food hardship</option><option value="HOUSING">Housing</option><option value="EMERGENCY">Emergency</option><option value="OTHER">Other</option></select>{categoryError && <small id="category-error" className="v2-field-error">{categoryError}</small>}</div>
      <div className="field full"><label htmlFor="description">Describe the need</label><textarea id="description" name="description" minLength={40} maxLength={5000} required placeholder="In your own words: what has happened, what support is needed, approximate amount if known, and anything time-sensitive." aria-invalid={Boolean(descriptionError) || undefined} aria-describedby={descriptionError ? "description-help description-error" : "description-help"} onChange={() => clearFieldError("description")} />{copy.descriptionHelp}{descriptionError && <small id="description-error" className="v2-field-error">{descriptionError}</small>}</div>
    </div><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(1)}>← Back</button><button className="v2-button" type="button" onClick={advance}>Continue to evidence →</button></div></fieldset>
    <fieldset id="assistance-step-3" data-assistance-step="3" tabIndex={-1} hidden={step !== 3} disabled={locked}><legend><span>03</span> Supporting evidence <small>optional</small></legend><div className="form-grid"><div className="field full v2-file-field"><label className="v2-file-dropzone" htmlFor="documents">{copy.evidenceInstructions}<span className="v2-file-selection" aria-live="polite">{selectedFiles.length ? `${selectedFiles.length} selected · ${selectedFiles.join(", ")}` : "No files selected"}</span></label><input className="v2-file-input" id="documents" name="documents" type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple aria-invalid={Boolean(documentError) || undefined} aria-describedby={documentError ? "documents-help documents-error" : "documents-help"} onChange={event => {
        const files = Array.from(event.currentTarget.files ?? []);
        setSelectedFiles(files.map(file => file.name));
        setDocumentError(assistanceDocumentSelectionIssue(files));
      }} />{copy.evidenceHelp}{documentError && <small id="documents-error" className="v2-field-error" role="alert">{documentError}</small>}</div></div><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(2)}>← Back</button><button className="v2-button" type="button" onClick={advance}>Continue to confirm →</button></div></fieldset>
    <fieldset id="assistance-step-4" data-assistance-step="4" tabIndex={-1} hidden={step !== 4} disabled={locked} className="v2-consent-fieldset"><legend><span>04</span> Confirm</legend>{copy.privacyNote}<div className="field full v2-form-choice"><label className="checkbox"><input name="consent" type="checkbox" required aria-invalid={Boolean(consentError) || undefined} aria-describedby={consentError ? "consent-error assistance-consent-help" : "assistance-consent-help"} onChange={() => clearFieldError("consent")} /><span><strong>I confirm the information I have provided is accurate to the best of my knowledge.</strong>{copy.consentHelp}</span></label>{consentError && <small id="consent-error" className="v2-field-error">{consentError}</small>}</div>{copy.termsNotice}<div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(3)} disabled={locked}>← Back</button></div></fieldset>
    {step === 4 ? <div className="v2-form-submit"><button className="v2-button" type="submit" disabled={locked}>{phase === "followup" ? "Follow-up required" : submitting ? "Submitting securely…" : "Submit private request →"}</button><small aria-live="polite">{phase === "followup" ? "Keep this page open and contact Amaana before submitting again." : submitting ? "Your private request is being submitted. Please do not close this page." : "After successful submission, keep the private reference and tracking link shown on the confirmation page."}</small></div> : null}
  </form>;
}
