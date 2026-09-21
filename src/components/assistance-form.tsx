"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { privateTrackingPath } from "@/lib/private-tracking";
import styles from "./assistance-form.module.css";

type AssistanceField = "applicantName" | "phone" | "email" | "city" | "category" | "description" | "consent";
type FieldErrors = Partial<Record<AssistanceField, string[]>>;
type AssistanceResponse = { error?: string; fields?: FieldErrors; referenceNumber?: string; trackingToken?: string };
type AssistanceStep = 1 | 2 | 3 | 4;
const assistanceFieldOrder: AssistanceField[] = ["applicantName", "phone", "email", "city", "category", "description", "consent"];
const fieldStep: Record<AssistanceField, AssistanceStep> = {
  applicantName: 1, phone: 1, email: 1, city: 1,
  category: 2, description: 2,
  consent: 4,
};
const stepLabels = ["Contact", "Need", "Evidence", "Confirm"] as const;

export function AssistanceForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<AssistanceStep>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<AssistanceStep>(1);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  function clearFieldError(field: AssistanceField) { setFieldErrors(current => current[field] ? { ...current, [field]: undefined } : current); }
  function firstFieldError(field: AssistanceField) { return fieldErrors[field]?.[0]; }
  function focusErrorSummary() { requestAnimationFrame(() => errorRef.current?.focus()); }

  function focusStep(target: AssistanceStep) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[data-assistance-step="${target}"]`)?.focus();
    }));
  }

  function goToStep(target: AssistanceStep) {
    setStep(target);
    setMaxVisitedStep(current => Math.max(current, target) as AssistanceStep);
    focusStep(target);
  }

  function validateStep(current: AssistanceStep) {
    const fieldset = formRef.current?.querySelector<HTMLElement>(`[data-assistance-step="${current}"]`);
    if (!fieldset) return false;
    const controls = Array.from(fieldset.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
    const invalid = controls.find(control => !control.checkValidity());
    if (!invalid) return true;
    invalid.reportValidity();
    invalid.focus();
    return false;
  }

  function advance() {
    if (!validateStep(step) || step >= 4) return;
    goToStep((step + 1) as AssistanceStep);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(""); setFieldErrors({}); setSubmitting(true);
    try {
      const response = await fetch("/api/assistance", { method: "POST", body: new FormData(form) });
      const result = await response.json() as AssistanceResponse;
      if (!response.ok) {
        const nextFieldErrors = result.fields ?? {};
        const message = result.error ?? "Submission failed";
        setFieldErrors(nextFieldErrors);
        setError(message);
        setSubmitting(false);
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
      if (!result.referenceNumber || !result.trackingToken) throw new Error("Submission succeeded but the tracking reference could not be prepared.");
      router.push(privateTrackingPath("/request-assistance/received", { reference: result.referenceNumber, token: result.trackingToken }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed");
      setSubmitting(false);
      focusErrorSummary();
    }
  }

  const nameError = firstFieldError("applicantName"); const phoneError = firstFieldError("phone"); const emailError = firstFieldError("email"); const cityError = firstFieldError("city"); const categoryError = firstFieldError("category"); const descriptionError = firstFieldError("description"); const consentError = firstFieldError("consent");

  return <form ref={formRef} className={`v2-premium-form v2-assistance-form ${styles.form}`} onSubmit={submit} encType="multipart/form-data" aria-busy={submitting} aria-labelledby="assistance-form-heading" aria-describedby="assistance-form-description">
    <div className="v2-form-heading"><span>Private submission</span><h2 id="assistance-form-heading">Tell us about the request.</h2><p id="assistance-form-description">Fields marked as required help the team identify and review the request. Optional information can be left out.</p></div>
    <nav className={styles.progress} aria-label="Assistance request progress">
      <p><strong>Step {step} of 4</strong><span>{stepLabels[step - 1]}</span></p>
      <ol>{stepLabels.map((label, index) => { const itemStep = (index + 1) as AssistanceStep; return <li key={label}><button type="button" onClick={() => goToStep(itemStep)} disabled={itemStep > maxVisitedStep || submitting} aria-current={itemStep === step ? "step" : undefined}><span>{String(itemStep).padStart(2, "0")}</span>{label}</button></li>; })}</ol>
    </nav>
    {error && <div ref={errorRef} className="form-error" role="alert" aria-live="assertive" tabIndex={-1}>{error}</div>}
    <fieldset data-assistance-step="1" tabIndex={-1} hidden={step !== 1}><legend><span>01</span> Contact</legend><div className="form-grid">
      <div className="field"><label htmlFor="name">Applicant name</label><input id="name" name="applicantName" autoComplete="name" minLength={2} maxLength={120} required aria-invalid={Boolean(nameError) || undefined} aria-describedby={nameError ? "name-error" : undefined} onChange={() => clearFieldError("applicantName")} />{nameError && <small id="name-error" className="v2-field-error">{nameError}</small>}</div>
      <div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={Boolean(phoneError) || undefined} aria-describedby={phoneError ? "phone-error" : undefined} onChange={() => clearFieldError("phone")} />{phoneError && <small id="phone-error" className="v2-field-error">{phoneError}</small>}</div>
      <div className="field"><label htmlFor="email">Email <span className="muted">optional</span></label><input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(emailError) || undefined} aria-describedby={emailError ? "email-error" : undefined} onChange={() => clearFieldError("email")} />{emailError && <small id="email-error" className="v2-field-error">{emailError}</small>}</div>
      <div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required aria-invalid={Boolean(cityError) || undefined} aria-describedby={cityError ? "city-error" : undefined} onChange={() => clearFieldError("city")} />{cityError && <small id="city-error" className="v2-field-error">{cityError}</small>}</div>
    </div><div className={styles.stepActions}><button className="v2-button" type="button" onClick={advance}>Continue to need →</button></div></fieldset>
    <fieldset data-assistance-step="2" tabIndex={-1} hidden={step !== 2}><legend><span>02</span> Need</legend><div className="form-grid">
      <div className="field full"><label htmlFor="category">Type of assistance</label><select id="category" name="category" required defaultValue="" aria-invalid={Boolean(categoryError) || undefined} aria-describedby={categoryError ? "category-error" : undefined} onChange={() => clearFieldError("category")}><option value="" disabled>Select the closest category</option><option value="MEDICAL">Medical</option><option value="EDUCATION">Education</option><option value="LIVELIHOOD">Livelihood</option><option value="FOOD_HARDSHIP">Food hardship</option><option value="HOUSING">Housing</option><option value="EMERGENCY">Emergency</option><option value="OTHER">Other</option></select>{categoryError && <small id="category-error" className="v2-field-error">{categoryError}</small>}</div>
      <div className="field full"><label htmlFor="description">Describe the need</label><textarea id="description" name="description" minLength={40} maxLength={5000} required placeholder="In your own words: what has happened, what support is needed, approximate amount if known, and anything time-sensitive." aria-invalid={Boolean(descriptionError) || undefined} aria-describedby={descriptionError ? "description-help description-error" : "description-help"} onChange={() => clearFieldError("description")} /><small id="description-help">40–5,000 characters. Please avoid unrelated sensitive information, passwords, OTPs or full banking credentials.</small>{descriptionError && <small id="description-error" className="v2-field-error">{descriptionError}</small>}</div>
    </div><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(1)}>← Back</button><button className="v2-button" type="button" onClick={advance}>Continue to evidence →</button></div></fieldset>
    <fieldset data-assistance-step="3" tabIndex={-1} hidden={step !== 3}><legend><span>03</span> Supporting evidence <small>optional</small></legend><div className="form-grid"><div className="field full v2-file-field"><label className="v2-file-dropzone" htmlFor="documents"><strong>Add private supporting files</strong><span>PDF, JPG, PNG or WEBP · up to 5 files · maximum 5 MB each</span><span className="v2-file-cta">Choose files securely</span><span className="v2-file-selection" aria-live="polite">{selectedFiles.length ? `${selectedFiles.length} selected · ${selectedFiles.join(", ")}` : "No files selected"}</span></label><input className="v2-file-input" id="documents" name="documents" type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple aria-describedby="documents-help" onChange={event => setSelectedFiles(Array.from(event.currentTarget.files ?? []).map(file => file.name))} /><small id="documents-help">Documents are used for private verification and administration. Uploading a document does not give Amaana permission to publish it.</small></div></div><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(2)}>← Back</button><button className="v2-button" type="button" onClick={advance}>Continue to confirm →</button></div></fieldset>
    <fieldset data-assistance-step="4" tabIndex={-1} hidden={step !== 4} className="v2-consent-fieldset"><legend><span>04</span> Confirm</legend><p className={styles.privacyNote}>Your request and supporting documents remain private by default. Public use of identity, photographs or sensitive circumstances is a separate reviewed decision.</p><div className="field full v2-form-choice"><label className="checkbox"><input name="consent" type="checkbox" required aria-invalid={Boolean(consentError) || undefined} aria-describedby={consentError ? "consent-error assistance-consent-help" : "assistance-consent-help"} onChange={() => clearFieldError("consent")} /><span><strong>I confirm the information I have provided is accurate to the best of my knowledge.</strong><small id="assistance-consent-help">I understand that submission does not guarantee assistance or public fundraising, and that Amaana may request further information to verify the need. Public use of a name, photograph or sensitive story details requires a separate decision and consent review.</small></span></label>{consentError && <small id="consent-error" className="v2-field-error">{consentError}</small>}</div><p className="muted">Before submitting, please review the <a href="/terms" target="_blank" rel="noreferrer">assistance and platform terms</a> and <a href="/privacy" target="_blank" rel="noreferrer">privacy notice</a>.</p><div className={styles.stepActions}><button className={styles.backButton} type="button" onClick={() => goToStep(3)} disabled={submitting}>← Back</button></div></fieldset>
    {step === 4 ? <div className="v2-form-submit"><button className="v2-button" type="submit" disabled={submitting}>{submitting ? "Submitting securely…" : "Submit private request →"}</button><small aria-live="polite">{submitting ? "Your private request is being submitted. Please do not close this page." : "After successful submission, keep the private reference and tracking link shown on the confirmation page."}</small></div> : null}
  </form>;
}
