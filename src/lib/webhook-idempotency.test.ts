import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isMatchingPaymentEventReplay, isPrismaUniqueConstraintError } from "./webhook-idempotency";

describe("webhook idempotency error classification", () => {
  it("recognizes Prisma unique constraint violations", () => {
    const error = new Prisma.PrismaClientKnownRequestError("duplicate provider event", {
      code: "P2002",
      clientVersion: "6.12.0",
      meta: { target: ["providerEventId"] },
    });

    expect(isPrismaUniqueConstraintError(error)).toBe(true);
  });

  it("does not swallow unrelated Prisma failures", () => {
    const error = new Prisma.PrismaClientKnownRequestError("record missing", {
      code: "P2025",
      clientVersion: "6.12.0",
    });

    expect(isPrismaUniqueConstraintError(error)).toBe(false);
  });

  it("does not classify arbitrary errors as duplicate delivery", () => {
    expect(isPrismaUniqueConstraintError(new Error("boom"))).toBe(false);
    expect(isPrismaUniqueConstraintError(null)).toBe(false);
  });
});


describe("financial webhook replay identity", () => {
  const original = {
    event: "refund.processed",
    refund: {
      id: "rfnd_123",
      payment_id: "pay_123",
      amount: 2500,
      currency: "INR",
      status: "processed",
    },
  };

  it("accepts exactly the same audited details independent of JSON object key order", () => {
    const persisted = {
      eventType: "refund.processed",
      payload: {
        refund: {
          status: "processed",
          amount: 2500,
          currency: "INR",
          payment_id: "pay_123",
          id: "rfnd_123",
        },
        event: "refund.processed",
      },
    };
    expect(isMatchingPaymentEventReplay(persisted, "refund.processed", original)).toBe(true);
  });

  it.each([
    ["amount", { ...original, refund: { ...original.refund, amount: 3500 } }],
    ["refund identity", { ...original, refund: { ...original.refund, id: "rfnd_different" } }],
    ["payment identity", { ...original, refund: { ...original.refund, payment_id: "pay_other" } }],
  ])("rejects a reused event ID with mismatched %s", (_label, payload) => {
    expect(isMatchingPaymentEventReplay({
      eventType: "refund.processed",
      payload: original,
    }, "refund.processed", payload)).toBe(false);
  });

  it("rejects different event types, absent rows and malformed historical payloads", () => {
    expect(isMatchingPaymentEventReplay(null, "refund.processed", original)).toBe(false);
    expect(isMatchingPaymentEventReplay({ eventType: "payment.failed", payload: original }, "refund.processed", original)).toBe(false);
    expect(isMatchingPaymentEventReplay({ eventType: "refund.processed", payload: null }, "refund.processed", original)).toBe(false);
  });
});
