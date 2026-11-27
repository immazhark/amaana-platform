// Synthetic data only. Never create a provider order or perform a payment.
export function workbenchDonationFixtures(appealId, now, hash) {
  if (typeof appealId !== 'string' || !appealId.trim()) throw new Error('Workbench fixture requires a dedicated synthetic appeal');
  const historical = new Date('2020-01-02T00:00:00.000Z');
  const paymentData = {appealId,fundId:null,donorName:'Synthetic workbench donor',donorEmail:'workbench@example.invalid',domesticConfirmedAt:historical,createdAt:historical,amount:'1',paymentMethod:'RAZORPAY',provider:'razorpay',providerPaymentId:null,status:'CREATED',transferReference:null,transferredAt:null};
  return {
    historical,
    first: {...paymentData,providerOrderId:'order_synthetic_workbench_01',receiptTokenHash:hash('synthetic-workbench-payment-01')},
    second: {...paymentData,providerOrderId:'order_synthetic_workbench_02',receiptTokenHash:hash('synthetic-workbench-payment-02')},
    claim: {appealId,fundId:null,donorName:'Synthetic workbench claimant',donorEmail:'workbench@example.invalid',domesticConfirmedAt:now,createdAt:now,amount:'100',receiptTokenHash:hash('synthetic-workbench-claim'),paymentMethod:'DIRECT_UPI',provider:null,providerOrderId:null,providerPaymentId:null,status:'PENDING_VERIFICATION',transferReference:'UI-WORKBENCH-SYNTHETIC-ONLY',transferredAt:now},
  };
}
