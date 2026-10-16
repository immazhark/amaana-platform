import { describe, expect, it } from "vitest";
import {
  donationOperationalState,
  notificationAttentionQueries,
  notificationOperationalState,
} from "./operational-signals";

describe("operational signal derivation", () => {
  it("reports notification delivery healthy only when all degradation counters are clear", () => {
    expect(notificationOperationalState({
      staleProcessing: 0,
      overdueDue: 0,
      terminalFailures: 0,
    })).toEqual({
      staleProcessing: 0,
      overdueDue: 0,
      terminalFailures: 0,
      attention: 0,
      status: "healthy",
    });
  });

  it("aggregates notification degradation and clamps invalid negative counts", () => {
    expect(notificationOperationalState({
      staleProcessing: 2,
      overdueDue: -3,
      terminalFailures: 4.9,
    })).toEqual({
      staleProcessing: 2,
      overdueDue: 0,
      terminalFailures: 4,
      attention: 6,
      status: "attention",
    });
  });

  it("reports donation reconciliation attention when any invariant is broken", () => {
    expect(donationOperationalState({
      unmatchedCriticalEvents: 1,
      missingAcknowledgements: 2,
      refundedWithoutCompletionTime: 1,
    })).toMatchObject({
      attention: 4,
      status: "attention",
    });
  });
  it("keeps attention eligibility at the established fifteen-minute/five-attempt boundaries", () => {
    const queries = notificationAttentionQueries(new Date("2026-10-17T12:30:00.000Z"));
    expect(queries.staleProcessing).toEqual({ channel: "EMAIL", status: "PROCESSING", updatedAt: { lt: new Date("2026-10-17T12:15:00.000Z") } });
    expect(queries.overdueDue).toEqual({ channel: "EMAIL", status: { in: ["PENDING", "FAILED"] }, attempts: { lt: 5 }, scheduledFor: { lt: new Date("2026-10-17T12:15:00.000Z") } });
    expect(queries.terminalFailures).toEqual({ channel: "EMAIL", status: "FAILED", OR: [{ attempts: { gte: 5 } }, { scheduledFor: { gte: new Date("9999-01-01T00:00:00.000Z") } }] });
  });

});
