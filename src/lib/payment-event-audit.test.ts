import { describe, expect, it } from "vitest";
import { paymentEventAuditPayload } from "./payment-event-audit";

describe("paymentEventAuditPayload", () => {
  it("keeps only reconciliation fields from payment webhooks", () => {
    expect(paymentEventAuditPayload({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_1",
            order_id: "order_1",
            amount: 50_000,
            currency: "INR",
            status: "captured",
            email: "donor@example.test",
            contact: "9999999999",
            notes: { secret: "not-needed" },
          } as never,
        },
      },
    })).toEqual({
      event: "payment.captured",
      payment: {
        id: "pay_1",
        order_id: "order_1",
        amount: 50_000,
        currency: "INR",
        status: "captured",
      },
    });
  });

  it("keeps only reconciliation fields from refund webhooks", () => {
    expect(paymentEventAuditPayload({
      event: "refund.processed",
      payload: {
        refund: {
          entity: {
            id: "rfnd_1",
            payment_id: "pay_1",
            amount: 10_000,
            currency: "INR",
            status: "processed",
          },
        },
      },
    })).toEqual({
      event: "refund.processed",
      refund: {
        id: "rfnd_1",
        payment_id: "pay_1",
        amount: 10_000,
        currency: "INR",
        status: "processed",
      },
    });
  });
});
