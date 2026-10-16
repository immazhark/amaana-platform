import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  findDisclosures: vi.fn(), findDocuments: vi.fn(), log: vi.fn(),
}));
vi.mock("./prisma", () => ({ prisma: {
  assistanceOutcomeDisclosure: { findMany: m.findDisclosures },
  assistanceDocument: { findMany: m.findDocuments },
} }));
vi.mock("./server-log", () => ({ logServerError: m.log }));

import { getPublishedAnonymousOutcomeNotes } from "./public-anonymous-outcomes";
import { ANONYMOUS_OUTCOME_COPY } from "./assistance-outcome-disclosure";

const source = {
  id: "outcome-synthetic", assistanceRequestId: "case-synthetic",
  kind: "PARTIAL_SUPPORT", state: "REVIEWED", updatedAt: new Date(),
  reportedById: "reporter-private", reviewedById: "reviewer-private",
  deliveryRecord: {
    kind: "IN_KIND", state: "CONFIRMED", evidenceDocumentId: "delivery-proof",
    financialReconciliation: null,
    assistanceRequest: {
      id: "case-synthetic", status: "APPROVED", appealId: null,
      verification: {
        decision: "APPROVED_PRIVATE", completedAt: new Date(),
        confidentialityLevel: "STANDARD",
      },
    },
  },
};
const approved = {
  copyText: ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT,
  consentDocumentId: "signed-specific-consent", observation: source,
};
const docs = [
  { id: "delivery-proof", assistanceRequestId: "case-synthetic" },
  { id: "signed-specific-consent", assistanceRequestId: "case-synthetic" },
];
beforeEach(() => {
  vi.resetAllMocks();
  m.findDisclosures.mockResolvedValue([approved]);
  m.findDocuments.mockResolvedValue(docs);
});

describe("public projection of explicitly released anonymous outcomes", () => {
  it("projects fixed copy only, never beneficiary or document identifiers", async () => {
    const results = await getPublishedAnonymousOutcomeNotes();
    expect(results).toEqual([ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT]);
    expect(JSON.stringify(results)).not.toContain("case-synthetic");
    expect(JSON.stringify(results)).not.toContain("signed-specific-consent");
    expect(JSON.stringify(results)).not.toContain("reporter-private");
    expect(m.findDisclosures).toHaveBeenCalledWith(expect.objectContaining({
      where: { state: "PUBLISHED" }, take: 48,
    }));
    const disclosureQuery = m.findDisclosures.mock.calls[0]?.[0];
    const sourceProjection = disclosureQuery?.select?.observation?.select;
    expect(sourceProjection).toBeDefined();
    expect(sourceProjection).not.toHaveProperty("reportedById");
    expect(sourceProjection).not.toHaveProperty("reviewedById");
    expect(sourceProjection).not.toHaveProperty("updatedAt");
    expect(sourceProjection.deliveryRecord.select.assistanceRequest.select)
      .not.toHaveProperty("applicantName");
    expect(m.findDocuments).toHaveBeenCalledWith({
      where: { id: { in: ["delivery-proof", "signed-specific-consent"] } },
      select: { id: true, assistanceRequestId: true },
    });
  });
  it("returns nothing when the publication record was withdrawn", async () => {
    m.findDisclosures.mockResolvedValue([]);
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([]);
    expect(m.findDocuments).not.toHaveBeenCalled();
  });
  it("does not return tampered text or internally reviewed but ineligible source", async () => {
    m.findDisclosures.mockResolvedValue([{ ...approved, copyText: "Private case note" }]);
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([]);
    m.findDisclosures.mockResolvedValue([{
      ...approved, observation: { ...source, state: "VOIDED" },
    }]);
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([]);
    m.findDisclosures.mockResolvedValue([{
      ...approved, observation: {
        ...source, deliveryRecord: { ...source.deliveryRecord,
          assistanceRequest: {
            ...source.deliveryRecord.assistanceRequest,
            verification: {
              ...source.deliveryRecord.assistanceRequest.verification,
              confidentialityLevel: "CONFIDENTIAL",
            },
          },
        },
      },
    }]);
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([]);
  });
  it("rejects deleted consent or evidence attached to a different case", async () => {
    m.findDocuments.mockResolvedValue([docs[0]]);
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([]);
    m.findDocuments.mockResolvedValue([
      docs[0], { id: "signed-specific-consent", assistanceRequestId: "another-case" },
    ]);
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([]);
  });
  it("deduplicates fixed wording without multiplying public-impact observations", async () => {
    m.findDisclosures.mockResolvedValue([approved, approved, approved]);
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([
      ANONYMOUS_OUTCOME_COPY.PARTIAL_SUPPORT,
    ]);
  });
  it("fails closed if source or consent checks cannot reach the database", async () => {
    m.findDocuments.mockRejectedValue(new Error("DB_OFFLINE"));
    expect(await getPublishedAnonymousOutcomeNotes()).toEqual([]);
    expect(m.log).toHaveBeenCalledWith("impact.anonymous_outcome_projection_unavailable");
  });
});
