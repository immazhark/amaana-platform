import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps, ReactNode } from "react";
import {
  AssistanceOutcomeDisclosureState, AssistanceOutcomeKind, AssistanceOutcomeReviewState,
} from "@prisma/client";

vi.mock("./disclosure-actions", () => ({
  proposeAnonymousOutcomeCopy: vi.fn(),
  reviewAnonymousOutcomeCopy: vi.fn(),
  publishAnonymousOutcomeCopy: vi.fn(),
  urgentlyWithdrawAnonymousOutcomeCopy: vi.fn(),
}));
vi.mock("@/components/navigation-link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    <a href={href}>{children}</a>,
}));

import { AnonymousDisclosureControls } from "./anonymous-disclosure-controls";

type Props = ComponentProps<typeof AnonymousDisclosureControls>;
const date = new Date("2026-10-16T09:00:00.000Z");
const base: Props = {
  caseId: "case-synthetic",
  actorId: "case-viewer",
  sourceEligible: true,
  standardConfidentiality: true,
  canPropose: false,
  canApprove: false,
  documents: [
    { id: "delivery-proof", originalName: "delivery.pdf" },
    { id: "bank-proof", originalName: "bank.pdf" },
    { id: "consent-specific", originalName: "specific-consent.pdf" },
  ],
  outcome: {
    id: "outcome-synthetic",
    kind: AssistanceOutcomeKind.PARTIAL_SUPPORT,
    state: AssistanceOutcomeReviewState.REVIEWED,
    reportedById: "source-reporter",
    reviewedById: "source-reviewer",
    updatedAt: date,
    deliveryRecord: {
      evidenceDocumentId: "delivery-proof",
      financialReconciliation: { bankProofDocumentId: "bank-proof" },
    },
    disclosure: null,
  },
};
const approved: NonNullable<Props["outcome"]["disclosure"]> = {
  id: "disclosure-synthetic",
  state: AssistanceOutcomeDisclosureState.APPROVED_COPY,
  copyText: "Amaana Foundation recorded partial support for a verified assistance case. Additional needs may remain.",
  consentDocumentId: "consent-specific",
  preparedById: "draft-preparer",
  approvedById: "copy-approver",
  updatedAt: date,
  publishedAt: null,
  approvedAt: date,
  approvedBy: { name: "Copy approver" },
};
function render(override: Partial<Props> = {}, disclosure = base.outcome.disclosure): string {
  const props: Props = {
    ...base, ...override,
    outcome: { ...base.outcome, ...override.outcome, disclosure },
  };
  return renderToStaticMarkup(<AnonymousDisclosureControls {...props}/>);
}
describe("private anonymous disclosure controls", () => {
  it("does not suggest public publishing for an unreviewed observation", () => {
    const html = render({
      outcome: { ...base.outcome, state: AssistanceOutcomeReviewState.REPORTED },
    });
    expect(html).not.toContain("Separate anonymous-copy consent");
    expect(html).not.toContain("Publish this anonymous note");
  });

  it("keeps read-only case viewers away from consent and publication actions", () => {
    const html = render({}, approved);
    expect(html).toContain("Anonymous copy approved internally");
    expect(html).not.toContain("Publish this anonymous note");
    expect(html).not.toContain("Withdraw this public note");
    expect(html).not.toContain("Submit anonymous wording");
  });

  it("requires STANDARD confidentiality and current evidence before showing a proposal", () => {
    expect(render({ canPropose: true, standardConfidentiality: false }))
      .not.toContain("Submit anonymous wording for independent approval");
    expect(render({ canPropose: true, sourceEligible: false }))
      .not.toContain("Submit anonymous wording for independent approval");
    const html = render({ canPropose: true });
    expect(html).toContain("Submit anonymous wording for independent approval");
    expect(html).toContain("specific-consent.pdf");
    expect(html).not.toContain('value="delivery-proof"');
    expect(html).not.toContain('value="bank-proof"');
  });

  it("requires an independent publisher, even after content approval", () => {
    const html = render({ canApprove: true, actorId: "copy-approver" }, approved);
    expect(html).not.toContain("Publish this anonymous note");
    expect(html).toContain("Withdraw anonymous-copy approval or proposal");
  });

  it("shows one withdrawal form to authorized reviewers of published notes", () => {
    const html = render({ canApprove: true, actorId: "final-publisher" }, {
      ...approved, state: AssistanceOutcomeDisclosureState.PUBLISHED, publishedAt: date,
    });
    expect(html).toContain("Withdraw this public note immediately");
    expect(html.match(/name="withdrawalReason"/g)).toHaveLength(1);
    expect(html).not.toContain("Publish this anonymous note on Impact");
  });

  it("offers withdrawal-only action to assistance editors without content approval", () => {
    const html = render({ canPropose: true, actorId: "assistance-editor" }, {
      ...approved, state: AssistanceOutcomeDisclosureState.PUBLISHED, publishedAt: date,
    });
    expect(html).toContain("Withdraw this public note immediately");
    expect(html).toContain("cannot approve or publish it");
    expect(html).not.toContain("Publish this anonymous note on Impact");
    expect(html.match(/name="withdrawalReason"/g)).toHaveLength(1);
  });

  it("keeps historical withdrawn copy visible but never actionable", () => {
    const html = render({ canApprove: true, canPropose: true }, {
      ...approved, state: AssistanceOutcomeDisclosureState.WITHDRAWN,
    });
    expect(html).toContain("withdrawn");
    expect(html).not.toContain('name="withdrawalReason"');
    expect(html).not.toContain("Publish this anonymous note on Impact");
  });
});
