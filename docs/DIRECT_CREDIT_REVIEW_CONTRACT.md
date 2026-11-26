# Direct-credit review — offline contract

AF-SETTLEMENT, synthetic-only until finance/provider input and handling approval. This is not a bank integration, tax report, complete ledger, proof of credit ownership or a reconciliation decision. It never verifies donations or changes any record.

The Node 22 command accepts a normalized JSON batch on standard input:

    node scripts/direct-credit-review.mjs < synthetic-batch.json

Example (synthetic references and opaque local row IDs):

    {"version":1,"currency":"INR","claims":[{"id":"c1","reference":"REF001","amountPaise":10000,"day":"2026-11-26"}],"credits":[{"id":"b1","reference":"REF001","amountPaise":10000,"day":"2026-11-26"}]}

Both lists must belong to the same independently reviewed bank-account scope and period. Claims represent pending direct-transfer claims only. Credits must be actual incoming credits, not debits, reversals, fees or provider settlement batches. The day is a normalized India calendar date. Finance must approve normalization from actual statement formats before real use. Never upload raw bank statements, names, account numbers, email, evidence or credentials. Generate opaque local IDs; references and source files stay in restricted local storage, outside Git. Output retains IDs and totals, not references. Treat output as private financial data.

Candidates require exactly one claim and one credit with identical case-sensitive reference, integer paise and day. Duplicates quarantine the entire reference group. Missing counterparts, amount differences and date differences are exceptions, not automatic rejection. No fuzzy match, split payment, batch settlement, currency conversion or date tolerance. No provider fee reconciliation in this tool. Candidate totals and unmatched totals are separate for each side, not income or bank-balance figures. Empty results do not establish complete coverage.

Input is bounded to 32 MiB and 100,000 rows per side. Unknown fields and unsafe totals are refused. Errors do not echo submitted values. Runtime uses indexed reference groups, O(claims + credits) expected time and memory. Reports are explicitly authoritative=false. Independently inspect source credit, ownership, reversals and other evidence before using the existing authorized manual reconciliation process. No live records or bank data were used in tests.

Run regression tests: node --test scripts/test-direct-credit-review.mjs.

Remaining acceptance: CA-approved source mapping, authorized local handling and actual bank/provider reconciliation review; no live activation or automatic approval implied.
