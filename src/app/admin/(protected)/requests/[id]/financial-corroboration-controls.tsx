import type {
  AssistanceDeliveryKind, AssistanceDeliveryReviewState,
  AssistanceFinancialReconciliationState,
} from "@prisma/client";
import {
  FINANCIAL_CORROBORATION_LABELS, maskFinancialReference,
} from "@/lib/assistance-financial-reconciliation";
import {
  proposeAssistanceFinancialCorroboration, reviewAssistanceFinancialCorroboration,
} from "./financial-actions";

type PrivateDocument = { id: string; originalName: string };

type FinancialDeliveryView = {
  id: string;
  kind: AssistanceDeliveryKind;
  state: AssistanceDeliveryReviewState;
  amountInr: { toFixed(digits: number): string } | null;
  evidenceDocumentId: string | null;
  reportedById: string;
  updatedAt: Date;
  financialReconciliation: {
    id: string;
    status: AssistanceFinancialReconciliationState;
    transactionReference: string;
    bankProofDocumentId: string | null;
    submittedById: string;
    reviewedAt: Date | null;
    reviewedBy: { name: string } | null;
    updatedAt: Date;
  } | null;
};

type Props = {
  caseId: string;
  delivery: FinancialDeliveryView;
  documents: readonly PrivateDocument[];
  actorId: string;
  canPropose: boolean;
  canReview: boolean;
  caseEligible: boolean;
};

/** Protected, review-gated bank-proof corroboration UI. No payment or
 * donor allocation is created; server actions enforce all access checks. */
export function FinancialCorroborationControls({
  caseId, delivery: item, documents, actorId, canPropose, canReview, caseEligible,
}: Props) {
  const evidenceNames = new Map(documents.map(document => [
    document.id, document.originalName,
  ]));
  return (
    <>
      {item.kind === "FINANCIAL" && item.amountInr &&
        (item.state === "CONFIRMED" || Boolean(item.financialReconciliation)) &&
        <div className="field">
          <h4>Private bank-proof corroboration</h4>
          <p className="muted">A case delivery, a donor allocation and a bank transaction
            are different records. Checking a document here does not transfer money,
            verify live bank settlement, or publish impact.</p>
          {item.financialReconciliation ? <>
            <strong>{FINANCIAL_CORROBORATION_LABELS[item.financialReconciliation.status]}</strong>
            {item.state !== "CONFIRMED" && <p role="alert" className="muted">
              The underlying delivery is no longer confirmed. This bank-proof history
              cannot be counted as an active reconciled financial delivery.</p>}
            <span>External reference: {canReview
              ? item.financialReconciliation.transactionReference
              : maskFinancialReference(item.financialReconciliation.transactionReference)}</span>
            <p className="muted">Bank proof: {item.financialReconciliation.bankProofDocumentId !== null && evidenceNames.has(item.financialReconciliation.bankProofDocumentId)
              ? <a href={`/admin/documents/${item.financialReconciliation.bankProofDocumentId}`}
                  target="_blank" rel="noreferrer">
                  {evidenceNames.get(item.financialReconciliation.bankProofDocumentId)}</a>
              : "Not currently available · this is historical review information only"}
            </p>
            {item.financialReconciliation.reviewedAt && <small>
              Finance reviewer: {item.financialReconciliation.reviewedBy?.name ?? "authorized staff"} ·
              {" "}{item.financialReconciliation.reviewedAt.toLocaleDateString("en-IN")}
            </small>}
            {canReview && caseEligible &&
              item.state === "CONFIRMED" &&
              item.financialReconciliation.status === "PENDING" &&
              item.financialReconciliation.submittedById !== actorId &&
              item.reportedById !== actorId &&
              item.evidenceDocumentId !== null && evidenceNames.has(item.evidenceDocumentId) &&
              item.financialReconciliation.bankProofDocumentId !== item.evidenceDocumentId &&
              item.financialReconciliation.bankProofDocumentId !== null && evidenceNames.has(item.financialReconciliation.bankProofDocumentId) &&
              <form action={reviewAssistanceFinancialCorroboration} className="field">
                <input type="hidden" name="id" value={caseId}/>
                <input type="hidden" name="reconciliationId" value={item.financialReconciliation.id}/>
                <input type="hidden" name="expectedUpdatedAt"
                  value={item.financialReconciliation.updatedAt.toISOString()}/>
                <input type="hidden" name="state" value="EVIDENCE_REVIEWED"/>
                <label>
                  <input type="checkbox" name="bankEvidenceAttested" value="yes" required/>
                  I compared the full reference, confirmed delivery amount
                  of INR {item.amountInr.toFixed(2)}, and bank document; I am not the reporter or proposer.
                </label>
                <button className="button secondary" type="submit">
                  Record independent bank-proof review
                </button>
              </form>}
            {canReview &&
              item.financialReconciliation.status !== "VOIDED" &&
              <form action={reviewAssistanceFinancialCorroboration} className="field">
                <input type="hidden" name="id" value={caseId}/>
                <input type="hidden" name="reconciliationId" value={item.financialReconciliation.id}/>
                <input type="hidden" name="expectedUpdatedAt"
                  value={item.financialReconciliation.updatedAt.toISOString()}/>
                <input type="hidden" name="state" value="VOIDED"/>
                <button className="button secondary" type="submit">Void incorrect bank-proof match</button>
              </form>}
          </> : canPropose && caseEligible && item.evidenceDocumentId &&
            evidenceNames.has(item.evidenceDocumentId) ? (
            <form action={proposeAssistanceFinancialCorroboration} className="field">
              <input type="hidden" name="id" value={caseId}/>
              <input type="hidden" name="deliveryRecordId" value={item.id}/>
              <input type="hidden" name="expectedDeliveryUpdatedAt" value={item.updatedAt.toISOString()}/>
              <label htmlFor={`bank-ref-${item.id}`}>Actual bank transaction reference</label>
              <input id={`bank-ref-${item.id}`} name="transactionReference"
                minLength={8} maxLength={64} pattern="[A-Za-z0-9/-]{8,64}" required/>
              <label htmlFor={`bank-amount-${item.id}`}>Exact supported INR amount</label>
              <input id={`bank-amount-${item.id}`} name="amountInr"
                type="number" step="0.01" min="0.01" required
                defaultValue={item.amountInr.toFixed(2)}/>
              <label htmlFor={`bank-proof-${item.id}`}>Private bank transaction proof</label>
              <select id={`bank-proof-${item.id}`} name="bankProofDocumentId"
                required defaultValue="">
                <option value="" disabled>Select a separate bank-proof document</option>
                {documents.filter(doc => doc.id !== item.evidenceDocumentId)
                  .map(doc => <option key={doc.id} value={doc.id}>{doc.originalName}</option>)}
              </select>
              <label>
                <input type="checkbox" name="bankEvidenceAttested" value="yes" required/>
                I checked that this document shows the actual transfer
                reference and amount. This is a private review request, not live bank reconciliation.
              </label>
              <button type="submit" className="button secondary">
                Propose private bank-proof corroboration
              </button>
            </form>
          ) : <p className="muted">Current delivery proof is required before
              separate bank evidence can be matched.</p>}
        </div>}
    </>
  );
}
