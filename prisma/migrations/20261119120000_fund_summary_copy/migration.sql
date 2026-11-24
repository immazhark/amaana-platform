-- Data-only copy tidy: the Zakat position is shown as a tag and notice on every fund card, so the
-- same sentence no longer needs to repeat inside the stored summary. Guarded and idempotent.
UPDATE "Fund" SET "summary" = 'Eid gift kits for families in need.'
  WHERE "id" = 'fund_eid_kits' AND "summary" = 'Eid gift kits for families in need. Zakat is not accepted for this fund.';
UPDATE "Fund" SET "summary" = 'Eid al-Adha meat distribution.'
  WHERE "id" = 'fund_qurbani' AND "summary" = 'Eid al-Adha meat distribution. Zakat is not accepted for this fund.';
UPDATE "Fund" SET "summary" = 'Dates distribution before Ramadan.'
  WHERE "id" = 'fund_dates' AND "summary" = 'Dates distribution before Ramadan. Zakat is not accepted for this fund.';
UPDATE "Fund" SET "summary" = 'Administration and recurring running costs of Amaana Foundation.'
  WHERE "id" = 'fund_foundation_operations' AND "summary" = 'Administration and recurring running costs of Amaana Foundation. Zakat is not accepted for this fund.';
