import type { AssistanceVerificationDecision } from "@prisma/client";
import {
  OUTCOME_KIND_LABELS, OUTCOME_REVIEW_LABELS,
} from "@/lib/assistance-outcome";
import {
  hasAccessiblePrivateOutcomeEvidence,
  type AssistanceCaseOutcome,
} from "@/lib/assistance-case-outcome-view";
import { reviewAssistanceOutcome } from "./outcome-actions";
import { AnonymousDisclosureControls } from "./anonymous-disclosure-controls";

type Props = {
  caseId: string;
  outcome: AssistanceCaseOutcome;
  caseStatus: string;
  appealId: string | null;
  verification: {
    decision: AssistanceVerificationDecision;
    completedAt: Date | null;
  } | null;
  standardConfidentiality: boolean;
  documentIds: ReadonlySet<string>;
  documents: readonly { id: string; originalName: string }[];
  actorId: string;
  mayReport: boolean;
  mayReview: boolean;
  mayApproveCopy: boolean;
};

/** One private operational observation. Its source can become invalid AFTER
 * staff review, so historical wording and current-action eligibility differ. */
export function OutcomeObservationRow({
  caseId, outcome, caseStatus, appealId, verification,
  standardConfidentiality, documentIds, documents,
  actorId, mayReport, mayReview, mayApproveCopy,
}: Props) {
  const delivery = outcome.deliveryRecord;
  const eligible = hasAccessiblePrivateOutcomeEvidence({
    ...delivery,
    assistanceRequest: { status: caseStatus, appealId, verification },
  }, documentIds);
  const canReview = mayReview && outcome.state === "REPORTED" &&
    outcome.reportedById !== actorId && delivery.reportedById !== actorId &&
    delivery.financialReconciliation?.submittedById !== actorId && eligible;

  return (
    <li>
      <strong>{OUTCOME_KIND_LABELS[outcome.kind]} · {OUTCOME_REVIEW_LABELS[outcome.state]}</strong>
      <p>{outcome.summary}</p>
      <span>Recorded by {outcome.reportedBy.name}
        {" · "}{outcome.createdAt.toLocaleDateString("en-IN")}</span>
      {outcome.reviewedAt && <p className="muted">
        Reviewed by {outcome.reviewedBy?.name ?? "authorized staff"}
        {" · "}{outcome.reviewedAt.toLocaleDateString("en-IN")}
      </p>}
      {!eligible && outcome.state === "REVIEWED" &&
        <p role="alert" className="muted">
          Supporting delivery evidence or case eligibility has changed.
          This is historical internal review, not a current verified outcome.
        </p>}
      {canReview &&
        <form action={reviewAssistanceOutcome} className="field">
          <input type="hidden" name="id" value={caseId}/>
          <input type="hidden" name="observationId" value={outcome.id}/>
          <input type="hidden" name="expectedUpdatedAt" value={outcome.updatedAt.toISOString()}/>
          <input type="hidden" name="state" value="REVIEWED"/>
          <label>
            <input type="checkbox" name="evidenceAttested" value="yes" required/>
            I reviewed the specific delivery and current private evidence, and I am
            independent of the original report and financial corroboration.
          </label>
          <button className="button secondary" type="submit">
            Review private operational outcome
          </button>
        </form>}
      <AnonymousDisclosureControls
        caseId={caseId}
        outcome={outcome}
        documents={documents}
        sourceEligible={eligible}
        standardConfidentiality={standardConfidentiality}
        canPropose={mayReport}
        canApprove={mayApproveCopy}
        actorId={actorId}
      />
      {mayReview && outcome.state !== "VOIDED" &&
        <form action={reviewAssistanceOutcome} className="field">
          <input type="hidden" name="id" value={caseId}/>
          <input type="hidden" name="observationId" value={outcome.id}/>
          <input type="hidden" name="expectedUpdatedAt" value={outcome.updatedAt.toISOString()}/>
          <input type="hidden" name="state" value="VOIDED"/>
          <button className="button secondary" type="submit">
            Void incorrect private outcome
          </button>
        </form>}
    </li>
  );
}
