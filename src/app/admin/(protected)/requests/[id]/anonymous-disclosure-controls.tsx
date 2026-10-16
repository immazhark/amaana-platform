import type {
  AssistanceOutcomeDisclosureState, AssistanceOutcomeKind, AssistanceOutcomeReviewState,
} from "@prisma/client";
import Link from "@/components/navigation-link";
import {
  ANONYMOUS_OUTCOME_COPY, ANONYMOUS_COPY_WITHDRAWAL_REASONS,
  DISCLOSURE_STATUS_LABELS,
} from "@/lib/assistance-outcome-disclosure";
import {
  proposeAnonymousOutcomeCopy, publishAnonymousOutcomeCopy, reviewAnonymousOutcomeCopy,
  urgentlyWithdrawAnonymousOutcomeCopy,
} from "./disclosure-actions";

type PrivateDocumentOption = { id: string; originalName: string };

type OutcomeDisclosureView = {
  id: string;
  kind: AssistanceOutcomeKind;
  state: AssistanceOutcomeReviewState;
  reportedById: string;
  reviewedById: string | null;
  updatedAt: Date;
  deliveryRecord: {
    evidenceDocumentId: string | null;
    financialReconciliation: { bankProofDocumentId: string | null } | null;
  };
  disclosure: {
    id: string;
    state: AssistanceOutcomeDisclosureState;
    copyText: string;
    consentDocumentId: string | null;
    preparedById: string;
    approvedById: string | null;
    updatedAt: Date;
    publishedAt: Date | null;
    approvedAt: Date | null;
    approvedBy: { name: string } | null;
  } | null;
};

type Props = {
  caseId: string;
  outcome: OutcomeDisclosureView;
  documents: readonly PrivateDocumentOption[];
  sourceEligible: boolean;
  standardConfidentiality: boolean;
  canPropose: boolean;
  canApprove: boolean;
  actorId: string;
};

/** Server-rendered, permission-scoped copy controls for one private case
 * observation. Server Actions repeat the authorization and evidence checks;
 * hiding a form is never considered a security boundary. */
export function AnonymousDisclosureControls({
  caseId, outcome: item, documents, sourceEligible,
  standardConfidentiality, canPropose, canApprove, actorId,
}: Props) {
  const evidenceNames = new Map(documents.map(document => [
    document.id, document.originalName,
  ]));
  return (
    <>
      {(item.state === "REVIEWED" || Boolean(item.disclosure)) &&
        <section aria-label="Anonymous outcome disclosure review">
          <h4>Separate anonymous-copy consent and approval</h4>
          <p className="muted">Internal outcome review does not authorize publication.
            An approved anonymous copy remains private until a separate release
            decision. Publication requires consent for the exact text, and the
            public note can be withdrawn when consent or evidence changes.
            Private case documents never appear on the public page.</p>
          <blockquote>{ANONYMOUS_OUTCOME_COPY[item.kind]}</blockquote>
          {item.disclosure ? <>
            <p><strong>{DISCLOSURE_STATUS_LABELS[item.disclosure.state]}</strong></p>
            {item.disclosure.copyText !== ANONYMOUS_OUTCOME_COPY[item.kind] &&
              <p role="alert" className="muted">The drafted copy differs from the approved
                standard wording. It cannot be approved.</p>}
            <p className="muted">Consent document: {
              item.disclosure.consentDocumentId &&
              evidenceNames.has(item.disclosure.consentDocumentId)
                ? <a href={`/admin/documents/${item.disclosure.consentDocumentId}`}
                    rel="noreferrer" target="_blank">
                    View exact-copy consent evidence</a>
                : "Not currently available"}</p>
            {item.disclosure.state === "PUBLISHED" && item.disclosure.publishedAt &&
              <p className="muted">Public release recorded {
                item.disclosure.publishedAt.toLocaleDateString("en-IN")
              }. The public site rechecks active eligibility on every response.
              <Link href="/impact">View Impact page</Link></p>}
            {item.disclosure.approvedAt &&
              <p className="muted">Decision recorded by {
                item.disclosure.approvedBy?.name ?? "authorized staff"
              } · {item.disclosure.approvedAt.toLocaleDateString("en-IN")}</p>}
            {(item.state !== "REVIEWED" || !standardConfidentiality || !sourceEligible ||
              !item.disclosure.consentDocumentId ||
              !evidenceNames.has(item.disclosure.consentDocumentId)) &&
              item.disclosure.state !== "WITHDRAWN" &&
              <p role="alert" className="muted">Consent, confidentiality or underlying
                evidence changed. {item.disclosure.state === "PUBLISHED"
                  ? "The published note is now ineligible and must be withdrawn immediately."
                  : item.disclosure.state === "APPROVED_COPY"
                    ? "Previous approval is historical, not current authorization for publication."
                    : "This draft must not be approved; withdraw it or resolve the underlying evidence issue."}</p>}
            {canApprove && item.disclosure.state === "DRAFT" &&
              item.disclosure.preparedById !== actorId &&
              item.reportedById !== actorId && item.reviewedById !== actorId &&
              item.state === "REVIEWED" &&
              standardConfidentiality &&
              sourceEligible && Boolean(item.disclosure.consentDocumentId &&
                evidenceNames.has(item.disclosure.consentDocumentId)) &&
              <form action={reviewAnonymousOutcomeCopy} className="field">
                <input type="hidden" name="id" value={caseId}/>
                <input type="hidden" name="disclosureId" value={item.disclosure.id}/>
                <input type="hidden" name="expectedUpdatedAt"
                  value={item.disclosure.updatedAt.toISOString()}/>
                <input type="hidden" name="decision" value="APPROVED_COPY"/>
                <label><input type="checkbox" name="consentReviewAttested"
                  value="yes" required/>I independently reviewed this
                  exact anonymous wording, the signed consent evidence,
                  and the currently verified case and delivery records.</label>
                <button className="button secondary" type="submit">
                  Approve anonymous copy internally — do not publish
                </button>
              </form>}
            {canApprove &&
              item.disclosure.state === "APPROVED_COPY" &&
              item.disclosure.approvedById !== actorId &&
              item.disclosure.preparedById !== actorId &&
              item.reportedById !== actorId &&
              item.reviewedById !== actorId &&
              standardConfidentiality &&
              sourceEligible &&
              item.disclosure.consentDocumentId &&
              evidenceNames.has(item.disclosure.consentDocumentId) &&
              <form action={publishAnonymousOutcomeCopy} className="field">
                <input type="hidden" name="id" value={caseId}/>
                <input type="hidden" name="disclosureId" value={item.disclosure.id}/>
                <input type="hidden" name="expectedUpdatedAt"
                  value={item.disclosure.updatedAt.toISOString()}/>
                <label>
                  <input type="checkbox" name="publicationAttested"
                    value="yes" required/>
                  I am a separate authorized publisher. I checked the exact
                  anonymous wording, specific written consent, confidentiality
                  and current private evidence. I understand this action
                  makes only this fixed text publicly visible on /impact.
                </label>
                <button className="button secondary" type="submit">
                  Publish this anonymous note on Impact
                </button>
              </form>}
            {(canApprove || canPropose) &&
              item.disclosure.state !== "WITHDRAWN" &&
              <form action={canApprove
                ? reviewAnonymousOutcomeCopy
                : urgentlyWithdrawAnonymousOutcomeCopy} className="field">
                <input type="hidden" name="id" value={caseId}/>
                <input type="hidden" name="disclosureId" value={item.disclosure.id}/>
                <input type="hidden" name="expectedUpdatedAt"
                  value={item.disclosure.updatedAt.toISOString()}/>
                <input type="hidden" name="decision" value="WITHDRAWN"/>
                <label htmlFor={`copy-withdraw-reason-${item.disclosure.id}`}>
                  Reason to withdraw this anonymous copy
                </label>
                <select id={`copy-withdraw-reason-${item.disclosure.id}`}
                  name="withdrawalReason" required defaultValue="">
                  <option value="" disabled>Choose a documented reason</option>
                  {Object.entries(ANONYMOUS_COPY_WITHDRAWAL_REASONS).map(([value, title]) =>
                    <option key={value} value={value}>{title}</option>)}
                </select>
                {!canApprove && <p className="muted">
                  Assistance editors may urgently withdraw private copy,
                  but cannot approve or publish it.
                </p>}
                <button className="button secondary" type="submit">
                  {item.disclosure.state === "PUBLISHED"
                    ? "Withdraw this public note immediately"
                    : canApprove
                      ? "Withdraw anonymous-copy approval or proposal"
                      : "Withdraw anonymous copy now"}
                </button>
              </form>}
          </> : canPropose && standardConfidentiality &&
            sourceEligible ? (
            <form className="field" action={proposeAnonymousOutcomeCopy}>
              <input type="hidden" name="id" value={caseId}/>
              <input type="hidden" name="observationId" value={item.id}/>
              <input type="hidden" name="expectedObservationUpdatedAt"
                value={item.updatedAt.toISOString()}/>
              <label htmlFor={`copy-consent-${item.id}`}>
                Private document authorizing this exact wording
              </label>
              <select id={`copy-consent-${item.id}`} name="consentDocumentId"
                defaultValue="" required>
                <option value="" disabled>Select specific, signed consent</option>
                {documents.filter(document =>
                  document.id !== item.deliveryRecord.evidenceDocumentId &&
                  document.id !== item.deliveryRecord.financialReconciliation?.bankProofDocumentId)
                  .map(document =>
                    <option key={document.id} value={document.id}>
                      {document.originalName}
                    </option>)}
              </select>
              <label>
                <input type="checkbox" name="exactCopyConsentAttested"
                  value="yes" required/>
                I confirmed that this document records permission from the
                applicant or authorized representative for the exact
                anonymous text shown above, not a general intake consent.
              </label>
              <button className="button secondary" type="submit">
                Submit anonymous wording for independent approval
              </button>
            </form>
          ) : <p className="muted">Anonymous-copy proposals require STANDARD
              confidentiality, a current reviewed outcome and complete
              supporting private evidence. Otherwise the outcome stays internal.</p>}
        </section>}
    </>
  );
}
