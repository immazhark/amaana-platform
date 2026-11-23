import styles from "./approval-check-answers.module.css";

const FIELDS = [
  ["decision", "Support route"], ["verifiedNeedAmount", "Verified need (₹)"], ["approvedPublicTarget", "Public target (₹)"],
  ["paymentDestination", "Payment destination"], ["verificationSummary", "Verification summary"],
  ["needConfirmed", "Need confirmed"], ["evidenceReviewed", "Evidence reviewed"], ["otherFundingChecked", "Other funding checked"],
  ["zakatStatus", "Zakat review"], ["confidentialityLevel", "Confidentiality"], ["publicNameConsent", "Public name permission"],
  ["photoConsent", "Photo permission"], ["medicalDetailsConsent", "Medical detail permission"],
  ["institutionNameConsent", "Institution naming permission"], ["archiveConsent", "Archive permission"],
] as const;

export function ApprovalSummary() {
  return <dialog className={styles.dialog} aria-labelledby="approval-check-heading">
    <h3 id="approval-check-heading" tabIndex={-1}>Check answers before approval</h3>
    <p>Check the entered decision below. Approval is not payment and does not publish an appeal.</p>
    <dl className="details">{FIELDS.map(([name, label]) => <div className="full" key={name}><dt>{label}</dt><dd data-review-field={name} /></div>)}</dl>
    <div className="actions">
      <button type="button" className="button secondary" data-review-cancel="">Back to edit</button>
      <button type="button" className="button" data-review-confirm="">Confirm approval</button>
    </div>
  </dialog>;
}
