import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import {
  AssistanceDeliveryKind, AssistanceDeliveryReviewState,
  AssistanceFinancialReconciliationState,
} from "@prisma/client";

vi.mock("./financial-actions", () => ({
  proposeAssistanceFinancialCorroboration: vi.fn(),
  reviewAssistanceFinancialCorroboration: vi.fn(),
}));
import { FinancialCorroborationControls } from "./financial-corroboration-controls";

type Props = ComponentProps<typeof FinancialCorroborationControls>;
const recordedAt = new Date("2026-10-16T10:00:00.000Z");
const reference = "ABCD123456789";
const base: Props = {
  caseId: "case-synthetic",
  actorId: "ordinary-viewer",
  canReview: false,
  canPropose: false,
  caseEligible: true,
  documents: [
    { id: "delivery-proof", originalName: "delivery.pdf" },
    { id: "bank-proof", originalName: "bank.pdf" },
  ],
  delivery: {
    id: "delivery-synthetic",
    kind: AssistanceDeliveryKind.FINANCIAL,
    state: AssistanceDeliveryReviewState.CONFIRMED,
    amountInr: { toFixed: () => "1250.50" },
    evidenceDocumentId: "delivery-proof",
    reportedById: "delivery-reporter",
    updatedAt: recordedAt,
    financialReconciliation: {
      id: "reconciliation-synthetic",
      status: AssistanceFinancialReconciliationState.PENDING,
      transactionReference: reference,
      bankProofDocumentId: "bank-proof",
      submittedById: "finance-proposer",
      reviewedAt: null,
      reviewedBy: null,
      updatedAt: recordedAt,
    },
  },
};
function render(override: Partial<Props> = {}): string {
  const props: Props = {
    ...base, ...override,
    delivery: { ...base.delivery, ...override.delivery },
  };
  return renderToStaticMarkup(<FinancialCorroborationControls {...props}/>);
}
describe("private financial corroboration controls", () => {
  it("never discloses the full bank reference to ordinary case viewers", () => {
    const html = render();
    expect(html).toContain("••••6789");
    expect(html).not.toContain(reference);
    expect(html).not.toContain("Record independent bank-proof review");
  });
  it("shows the full reference only with finance-review permission", () => {
    const html = render({ canReview: true, actorId: "independent-finance-reviewer" });
    expect(html).toContain(reference);
    expect(html).toContain("Record independent bank-proof review");
    expect(html).toContain("INR 1250.50");
    expect(html).toContain("bank.pdf");
  });
  it("never offers a reviewer their own proposal or reported delivery", () => {
    const maker = render({ canReview: true, actorId: "finance-proposer" });
    expect(maker).not.toContain("Record independent bank-proof review");
    const reporter = render({ canReview: true, actorId: "delivery-reporter" });
    expect(reporter).not.toContain("Record independent bank-proof review");
  });
  it("retains historical evidence but blocks active review after delivery invalidation", () => {
    const html = render({
      canReview: true,
      actorId: "independent-finance-reviewer",
      delivery: { ...base.delivery, state: AssistanceDeliveryReviewState.VOIDED },
    });
    expect(html).toContain("no longer confirmed");
    expect(html).toContain("cannot be counted as an active");
    expect(html).not.toContain("Record independent bank-proof review");
    expect(html).toContain("Void incorrect bank-proof match");
  });
  it("hides review if the case or one of its distinct evidence links is invalid", () => {
    expect(render({ canReview: true, caseEligible: false }))
      .not.toContain("Record independent bank-proof review");
    expect(render({ canReview: true, documents: [{ id: "bank-proof", originalName: "bank.pdf" }] }))
      .not.toContain("Record independent bank-proof review");
    const duplicatedEvidence = render({ canReview: true,
      delivery: { ...base.delivery, financialReconciliation: {
        ...base.delivery.financialReconciliation!, bankProofDocumentId: "delivery-proof",
      } },
    });
    expect(duplicatedEvidence).not.toContain("Record independent bank-proof review");
  });
  it("does not provide new bank-document proposal for staff without case-update permission", () => {
    const html = render({
      delivery: { ...base.delivery, financialReconciliation: null },
    });
    expect(html).not.toContain("Propose private bank-proof corroboration");
  });
  it("requires distinct supporting documents in the proposal dropdown", () => {
    const html = render({
      canPropose: true,
      delivery: { ...base.delivery, financialReconciliation: null },
    });
    expect(html).toContain("Propose private bank-proof corroboration");
    expect(html).not.toContain('value="delivery-proof"');
    expect(html).toContain('value="bank-proof"');
    expect(html).toContain("not live bank reconciliation");
  });
  it("does not show financial controls for an in-kind delivery", () => {
    const html = render({
      delivery: { ...base.delivery, kind: AssistanceDeliveryKind.IN_KIND },
    });
    expect(html).not.toContain("Private bank-proof corroboration");
  });
});
