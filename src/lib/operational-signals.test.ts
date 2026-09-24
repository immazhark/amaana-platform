import { describe, expect, it } from "vitest";
import {
  donationOperationalState,
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
});
