# Giving foundation — approved source slice, 9 November 2026 IST

Owner confirmed Part 2 after the reviewed Master Donation Engine plan. This bounded slice adds pure contracts and review UI only.

Acceptance: exact decimal-string/paise conversion and bounded values; balanced journals and conserved gross allocations; strict current fund/policy/price identity and lifecycle; evidence references and non-eligible intent/endowment denial; account/environment/method/frequency-specific capability validation; malformed or missing data fail closed; six synthetic journey scenarios; labelled accessible review controls, coherent validation feedback, no donor PII and no usable payment submission.

Synthetic records stay in tests/browser fixtures, excluded from ordinary production materialization. New types do not establish qualified approval or live eligibility. Existing donation schema, amount limits, final-balance exception, domestic-INR checks, permissions, QR hold and payment/reconciliation behavior stay untouched. No dependency addition is necessary for this slice.

Later schema/payment/identity plans need their exact reviewed source/migration scopes and separately authorized live actions. No database or receiving-bank changes are part of this PR. Rollback: revert the new standalone foundation modules/component and acceptance fixtures.
