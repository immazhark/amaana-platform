import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  donation: { id: 'synthetic-donation', status: 'AUTHORIZED', providerPaymentId: 'pay_new' as string | null, amount: { mul: () => ({ toNumber: () => 50000 }) } },
  events: [] as unknown[],
  capture: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: {
  paymentEvent: { findUnique: vi.fn(async () => null) },
  $transaction: vi.fn(async callback => callback({
    donation: {
      findUnique: vi.fn(async () => state.donation),
      updateMany: vi.fn(async ({ where, data }) => {
        // Model the old status-only predicate and the fixed attempt-bound one.
        // Actual Prisma predicate behavior is covered by the PostgreSQL suite.
        const matches = where.OR
          ? where.OR.some((condition: { status: string; providerPaymentId?: string }) =>
              condition.status === state.donation.status &&
              (condition.providerPaymentId === undefined || condition.providerPaymentId === state.donation.providerPaymentId))
          : where.status.in.includes(state.donation.status);
        if (state.donation.id === where.id && matches) {
          Object.assign(state.donation, data);
          return { count: 1 };
        }
        return { count: 0 };
      }),
    },
    paymentEvent: { create: vi.fn(async ({ data }) => { state.events.push(data); return data; }) },
  })),
} }));
vi.mock('@/lib/env', () => ({ validateProductionEnvironment: () => undefined }));
vi.mock('@/lib/payment-processing', () => ({ captureDonation: state.capture, ensureCapturedDonationForRefund: vi.fn() }));
import { POST } from "./route";
const secret = 'synthetic-webhook-secret';
beforeEach(() => {
  state.donation.status = 'AUTHORIZED'; state.donation.providerPaymentId = 'pay_new'; state.events.length = 0;
  vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', secret);
});
afterEach(() => vi.unstubAllEnvs());
function request(paymentId: string) {
  const body = JSON.stringify({ event: 'payment.failed', payload: { payment: { entity: {
    id: paymentId, order_id: 'order_shared', amount: 50000, currency: 'INR', status: 'failed',
  } } } });
  return new Request('https://amaana.example/api/webhooks/razorpay', { method: 'POST', body, headers: {
    'Content-Type': 'application/json', 'x-razorpay-event-id': 'evt_synthetic',
    'x-razorpay-signature': createHmac('sha256', secret).update(body).digest('hex'),
  } });
}
it('keeps a newer authorized attempt when an older attempt fails late', async () => {
  expect((await POST(request('pay_old'))).status).toBe(200);
  expect(state.events).toHaveLength(1);
  expect({ status: state.donation.status, paymentId: state.donation.providerPaymentId })
    .toEqual({ status: 'AUTHORIZED', paymentId: 'pay_new' });
});
it('still marks the currently authorized attempt failed', async () => {
  expect((await POST(request('pay_new'))).status).toBe(200);
  expect(state.events).toHaveLength(1);
  expect({ status: state.donation.status, paymentId: state.donation.providerPaymentId })
    .toEqual({ status: 'FAILED', paymentId: 'pay_new' });
});
it('preserves a captured donation when an older attempt fails late', async () => {
  state.donation.status = 'CAPTURED';
  expect((await POST(request('pay_old'))).status).toBe(200);
  expect({ status: state.donation.status, paymentId: state.donation.providerPaymentId })
    .toEqual({ status: 'CAPTURED', paymentId: 'pay_new' });
});

it('preserves a refunded donation when an older attempt fails late', async () => {
  state.donation.status = 'REFUNDED';
  expect((await POST(request('pay_old'))).status).toBe(200);
  expect(state.events).toHaveLength(1);
  expect({ status: state.donation.status, paymentId: state.donation.providerPaymentId })
    .toEqual({ status: 'REFUNDED', paymentId: 'pay_new' });
});
it('still marks an unconfirmed created order failed', async () => {
  state.donation.status = 'CREATED';
  state.donation.providerPaymentId = null;
  expect((await POST(request('pay_old'))).status).toBe(200);
  expect(state.events).toHaveLength(1);
  expect({ status: state.donation.status, paymentId: state.donation.providerPaymentId })
    .toEqual({ status: 'FAILED', paymentId: 'pay_old' });
});
