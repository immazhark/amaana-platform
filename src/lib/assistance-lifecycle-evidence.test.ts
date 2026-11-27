import { describe, expect, it } from "vitest";
import { closureTransitionQuery, lifecycleEvidence } from "./assistance-lifecycle-evidence";

const received = new Date("2026-11-01T00:00:00Z");
const accepted = new Date("2026-11-02T00:00:00Z");
const closed = new Date("2026-11-03T00:00:00Z");
const base = { status: "APPROVED", createdAt: received, acceptedAt: accepted, verification: { decision: "APPROVED_PRIVATE", completedAt: accepted }, appealId: null, appeal: null };

describe("case lifecycle evidence", () => {
  it("keeps formal acceptance, verification, support route and linked appeal separate", () => {
    expect(lifecycleEvidence(base, null)).toMatchObject({ acceptedAt: accepted, verificationCompletedAt: accepted, route: "Private assistance", appealState: "No linked appeal", gaps: [], closure: { kind: "not_closed" }, deliveryEstablished: false });
  });
  it("never treats an appeal closure as a closed case or delivered support", () => {
    expect(lifecycleEvidence({ ...base, status: "CONVERTED_TO_APPEAL", appealId: "a", appeal: { status: "CLOSED" }, verification: { decision: "APPROVED_PUBLIC", completedAt: accepted } }, null)).toMatchObject({ appealState: "Closed", closure: { kind: "not_closed" }, deliveryEstablished: false });
  });
  it("separates missing, unavailable and recorded closure evidence", () => {
    const record = { ...base, status: "CLOSED", updatedAt: closed };
    expect(lifecycleEvidence(record, null).closure).toEqual({ kind: "missing" });
    expect(lifecycleEvidence(record, undefined).closure).toEqual({ kind: "unavailable" });
    expect(lifecycleEvidence(record, { createdAt: closed }).closure).toEqual({ kind: "recorded", at: closed });
    expect(lifecycleEvidence(record, { createdAt: new Date("2026-10-01") }).closure).toEqual({ kind: "missing" });
  });
  it("flags inconsistent acceptance, verification and missing linked appeal evidence", () => {
    expect(lifecycleEvidence({ ...base, status: "CONVERTED_TO_APPEAL", acceptedAt: new Date("2026-10-01"), verification: { decision: "PENDING", completedAt: null }, appealId: "a", appeal: null }, null)).toMatchObject({ acceptedAt: null, verificationCompletedAt: null, appealState: "Linked appeal record unavailable", gaps: ["acceptance", "verification", "appeal_link"] });
  });
  it("bounds the latest closure transition to one case and excludes note-only saves without returning metadata", () => {
    expect(closureTransitionQuery("case")).toEqual({
      where: { entityType: "AssistanceRequest", entityId: "case", action: "assistance.updated", AND: [
        { metadata: { path: ["status"], equals: "CLOSED" } },
        { OR: ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED", "REJECTED"].map(value => ({ metadata: { path: ["previousStatus"], equals: value } })) },
      ] },
      select: { createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1,
    });
  });
});
