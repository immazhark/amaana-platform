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

  return <form className="card form-card" onSubmit={submit} encType="multipart/form-data">
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="form-grid"><div className="field"><label htmlFor="name">Applicant name</label><input id="name" name="applicantName" autoComplete="name" minLength={2} maxLength={120} required /></div><div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" required /></div><div className="field"><label htmlFor="email">Email <span className="muted">(optional)</span></label><input id="email" name="email" type="email" autoComplete="email" /></div><div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required /></div><div className="field full"><label htmlFor="category">Type of assistance</label><select id="category" name="category" required defaultValue=""><option value="" disabled>Select a category</option><option value="MEDICAL">Medical</option><option value="EDUCATION">Education</option><option value="LIVELIHOOD">Livelihood</option><option value="FOOD_HARDSHIP">Food hardship</option><option value="HOUSING">Housing</option><option value="EMERGENCY">Emergency</option><option value="OTHER">Other</option></select></div><div className="field full"><label htmlFor="description">Describe the need</label><textarea id="description" name="description" minLength={40} maxLength={5000} required placeholder="Explain the situation, support needed, approximate amount and urgency." /></div><div className="field full"><label htmlFor="documents">Supporting documents <span className="muted">(optional)</span></label><input id="documents" name="documents" type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple /><small className="muted">Up to 5 PDF or image files, maximum 5 MB each. Documents remain private.</small></div><div className="field full"><label className="checkbox"><input name="consent" type="checkbox" required /><span>I confirm these details are accurate and consent to being contacted for verification. I understand that submission does not guarantee assistance or publication.</span></label></div><div className="field full"><button className="button" type="submit" disabled={submitting}>{submitting ? "Submitting securely…" : "Submit request"}</button></div></div>
  </form>;
}
