# Amaana Foundation — Payment & Refund Operations Runbook

This runbook covers operational verification of Razorpay donation, acknowledgement and refund flows. It does **not** authorize live payments, refunds, production cutover, indexing, or a merge to `main`.

## Current posture

- Donation acceptance remains domestic India-only.
- Live Razorpay activity remains blocked until KYC/account readiness is confirmed and explicit authorization is given.
- Staging/browser acceptance must remain synthetic and must not create a real charge.
- Payment webhooks are signature-verified and idempotent by provider event id.
- Stored webhook evidence is privacy-minimized to reconciliation fields only.
- Refund accounting is bounded so donation refunds cannot exceed the donation amount and appeal totals cannot go below zero.
- Refunds can reopen a previously funded appeal only when retained funds fall below the goal and the fundraising window is still open.
- If the fundraising window has expired, a refund-driven under-target funded appeal moves to CLOSED instead of silently reopening.
- Out-of-order `refund.processed` delivery is reconciled through the provider payment/order relationship before applying refund accounting.
- Admin donation operations surface unmatched critical payment/refund events for manual investigation.

## Before any live acceptance

1. Confirm Razorpay live/KYC readiness.
2. Record the exact application candidate SHA.
3. Confirm database backup/recovery evidence and rollback readiness.
4. Confirm the intended appeal is explicitly approved for the controlled test.
5. Confirm the payment amount and refund amount are approved in advance.
6. Confirm the test donor identity/email belongs to the Amaana team.
7. Confirm transactional email is either intentionally live for the controlled acceptance or explicitly disabled with a documented reason.

## Controlled donation acceptance

With explicit authorization only:

1. Create one small controlled domestic donation.
2. Record the Amaana donation reference and Razorpay order id in the protected operational record.
3. Confirm:
   - order amount and currency are exact;
   - browser confirmation and Razorpay payment refer to the same order;
   - webhook reconciliation reaches the same donation;
   - donation status reaches CAPTURED;
   - provider payment id is recorded once;
   - receipt/acknowledgement number is created once;
   - appeal amount raised increases by exactly the captured donation amount;
   - the appeal changes to FUNDED only if the retained total reaches the goal;
   - exactly one donor acknowledgement notification is queued.
4. Verify the private acknowledgement page using its tokenized link.
5. Confirm it is no-store, no-referrer and noindex.

## Controlled refund acceptance

With explicit authorization only:

1. Refund the pre-approved controlled donation amount through Razorpay.
2. Confirm the `refund.processed` webhook is accepted exactly once.
3. Confirm:
   - `refundedAmount` increases by no more than the provider-confirmed refund;
   - a partial refund keeps the donation CAPTURED and shows a partial-refund acknowledgement;
   - a full refund moves the donation to REFUNDED and records `refundedAt`;
   - appeal `amountRaised` decreases by the retained refund effect and never below zero;
   - if a refund drops a FUNDED appeal below target before its deadline, the appeal returns to PUBLISHED;
   - if the same happens after the fundraising deadline, the appeal becomes CLOSED;
   - duplicate refund delivery is a financial no-op after the provider event has already been recorded.
4. Verify the private acknowledgement reflects the refund state accurately.

## Out-of-order provider events

Razorpay webhooks can arrive in a different order from the underlying financial events.

For `refund.processed` received before local capture reconciliation:

1. The application checks for an already-linked local provider payment.
2. If local capture is missing, it fetches the provider payment by payment id.
3. The provider payment must:
   - match the refund payment id;
   - use INR;
   - contain a Razorpay order id;
   - have an integer paise amount.
4. The order must map to an Amaana donation and the amount must match exactly.
5. The existing idempotent capture path runs first.
6. Refund accounting then runs against the now-reconciled donation.

A provider payment unrelated to an Amaana order is not force-linked. Its critical webhook event remains visible as an unmatched reconciliation item in the admin donation operations view.

## Admin reconciliation checks

Review `/admin/donations` and the individual donation record.

Investigate immediately when:

- a critical `payment.captured`, `payment.failed` or `refund.processed` event has no linked donation;
- provider order/payment ids disagree with the controlled acceptance record;
- a CAPTURED donation has an unexpected refund amount;
- appeal totals do not equal the retained donation totals expected for the controlled test;
- duplicate acknowledgements or duplicate provider events appear;
- a refund changes an appeal status unexpectedly.

Do not “fix” financial records manually in the database. Reconcile the provider event and application logic first.

## Evidence hygiene

Do not commit or paste into GitHub:

- Razorpay secrets;
- webhook secrets;
- full webhook payloads;
- donor banking/card data;
- receipt access tokens;
- private donor contact details.

The repository may record non-sensitive reference ids, candidate SHA, deployment ids, statuses and reconciliation outcomes.

## Launch gates

The following remain PENDING until actually exercised with explicit authorization:

- `razorpay-live-kyc-readiness`;
- `controlled-live-donation-acceptance`;
- `refund-receipt-operational-check`.

Automated/synthetic coverage proves code paths, not real provider readiness.
