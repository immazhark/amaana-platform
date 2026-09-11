"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AssistanceForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const response = await fetch("/api/assistance", { method: "POST", body: new FormData(event.currentTarget) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Submission failed");
      router.push(`/request-assistance/received?reference=${encodeURIComponent(result.referenceNumber)}&token=${encodeURIComponent(result.trackingToken)}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Submission failed"); setSubmitting(false); }
  }

  return <form className="v2-premium-form v2-assistance-form" onSubmit={submit} encType="multipart/form-data">
    <div className="v2-form-heading"><span>Private submission</span><h2>Tell us about the request.</h2><p>Fields marked as required help the team identify and review the request. Optional information can be left out.</p></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    <fieldset><legend><span>01</span> Contact</legend><div className="form-grid"><div className="field"><label htmlFor="name">Applicant name</label><input id="name" name="applicantName" autoComplete="name" minLength={2} maxLength={120} required /></div><div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" required /></div><div className="field"><label htmlFor="email">Email <span className="muted">optional</span></label><input id="email" name="email" type="email" autoComplete="email" /></div><div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required /></div></div></fieldset>
    <fieldset><legend><span>02</span> Need</legend><div className="form-grid"><div className="field full"><label htmlFor="category">Type of assistance</label><select id="category" name="category" required defaultValue=""><option value="" disabled>Select the closest category</option><option value="MEDICAL">Medical</option><option value="EDUCATION">Education</option><option value="LIVELIHOOD">Livelihood</option><option value="FOOD_HARDSHIP">Food hardship</option><option value="HOUSING">Housing</option><option value="EMERGENCY">Emergency</option><option value="OTHER">Other</option></select></div><div className="field full"><label htmlFor="description">Describe the need</label><textarea id="description" name="description" minLength={40} maxLength={5000} required placeholder="In your own words: what has happened, what support is needed, approximate amount if known, and anything time-sensitive." /><small>40–5,000 characters. Please avoid unrelated sensitive information.</small></div></div></fieldset>
    <fieldset><legend><span>03</span> Supporting evidence <small>optional</small></legend><div className="form-grid"><div className="field full v2-file-field"><label htmlFor="documents"><strong>Add private supporting files</strong><span>PDF, JPG, PNG or WEBP · up to 5 files · maximum 5 MB each</span></label><input id="documents" name="documents" type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple /><small>Documents are used for private review and are not automatically published.</small></div></div></fieldset>
    <fieldset className="v2-consent-fieldset"><legend><span>04</span> Confirm</legend><div className="field full v2-form-choice"><label className="checkbox"><input name="consent" type="checkbox" required /><span><strong>I confirm the information is accurate to the best of my knowledge.</strong><small>I consent to being contacted for verification and understand that submission does not guarantee assistance or public publication.</small></span></label></div></fieldset>
    <div className="v2-form-submit"><button className="v2-button" type="submit" disabled={submitting}>{submitting ? "Submitting securely…" : "Submit private request →"}</button><small>After successful submission, keep the reference number shown on the confirmation page.</small></div>
  </form>;
}
