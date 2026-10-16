import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import {
  AssistanceDeliveryKind, AssistanceDeliveryReviewState,
  AssistanceOutcomeKind, AssistanceOutcomeReviewState,
} from "@prisma/client";
vi.mock("./outcome-actions", () => ({
  reviewAssistanceOutcome: vi.fn(),
}));
vi.mock("./anonymous-disclosure-controls", () => ({
  AnonymousDisclosureControls: () => <p>Scoped private disclosure controls</p>,
}));
import { OutcomeObservationRow } from "./outcome-observation-row";

type Props = ComponentProps<typeof OutcomeObservationRow>;
const date = new Date("2026-10-16T09:00:00.000Z");
const observation: Props["outcome"] = {
  id: "outcome-synthetic",
  kind: AssistanceOutcomeKind.PARTIAL_SUPPORT,
  state: AssistanceOutcomeReviewState.REPORTED,
  summary: "Internal, private support delivery assessment.",
  deliveryRecordId: "delivery-synthetic",
  reportedById: "outcome-reporter",
  reviewedById: null,
  updatedAt: date,
  createdAt: date,
  reviewedAt: null,
  reportedBy: { name: "Outcome reporter" },
  reviewedBy: null,
  disclosure: null,
  deliveryRecord: {
    kind: AssistanceDeliveryKind.IN_KIND,
    state: AssistanceDeliveryReviewState.CONFIRMED,
    reportedById: "delivery-reporter",
    evidenceDocumentId: "delivery-proof",
    financialReconciliation: null,
  },
};
const base: Props = {
  caseId: "case-synthetic",
  outcome: observation,
  caseStatus: "APPROVED",
  appealId: null,
  verification: { decision: "APPROVED_PRIVATE", completedAt: date },
  standardConfidentiality: true,
  documentIds: new Set(["delivery-proof"]),
  documents: [{ id: "delivery-proof", originalName: "delivery.pdf" }],
  actorId: "case-viewer",
  mayReport: false,
  mayReview: false,
  mayApproveCopy: false,
};
function render(override: Partial<Props> = {}): string {
  const props = { ...base, ...override };
  return renderToStaticMarkup(<OutcomeObservationRow {...props}/>);
}
describe("private outcome observation row", () => {
  it("does not show privileged review controls to an ordinary case viewer", () => {
    const html = render();
    expect(html).toContain("Internal, private support delivery assessment.");
    expect(html).toContain("Scoped private disclosure controls");
    expect(html).not.toContain("Review private operational outcome");
    expect(html).not.toContain("Void incorrect private outcome");
  });
  it("allows an independent reviewer only with approved case and existing evidence", () => {
    const html = render({ mayReview: true, actorId: "independent-reviewer" });
    expect(html).toContain("Review private operational outcome");
    expect(html).toContain('name="evidenceAttested"');
    expect(html).toContain("Void incorrect private outcome");
  });
  it("blocks self-review by both the outcome reporter and delivery reporter", () => {
    expect(render({ mayReview: true, actorId: "outcome-reporter" }))
      .not.toContain("Review private operational outcome");
    expect(render({ mayReview: true, actorId: "delivery-reporter" }))
      .not.toContain("Review private operational outcome");
  });
  it("shows historical warning when the case no longer qualifies", () => {
    const html = render({
      mayReview: true,
      caseStatus: "REJECTED",
      outcome: {
        ...observation,
        state: AssistanceOutcomeReviewState.REVIEWED,
        reviewedAt: date, reviewedById: "original-reviewer",
        reviewedBy: { name: "Original reviewer" },
      },
    });
    expect(html).toContain("historical internal review");
    expect(html).not.toContain("Review private operational outcome");
    expect(html).toContain("Void incorrect private outcome");
  });
  it("does not treat a retained but unlinked document as current evidence", () => {
    const html = render({
      mayReview: true,
      documentIds: new Set(["some-other-document"]),
    });
    expect(html).not.toContain("Review private operational outcome");
    expect(html).toContain("Void incorrect private outcome");
  });
});
