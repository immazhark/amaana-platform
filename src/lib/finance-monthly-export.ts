import type { Prisma } from "@prisma/client";

const KOLKATA_OFFSET_MINUTES = 330;
const MAX_FINANCE_EXPORT_ROWS = 5000;

export const FINANCE_EXPORT_ROW_LIMIT = MAX_FINANCE_EXPORT_ROWS;

export function financeMonthBounds(input: string) {
  if (!/^(20[2-9]\d|2100)-(0[1-9]|1[0-2])$/.test(input)) return null;
  const year = Number(input.slice(0, 4));
  const month = Number(input.slice(5, 7));
  const offset = KOLKATA_OFFSET_MINUTES * 60_000;

  return {
    month: input,
    start: new Date(Date.UTC(year, month - 1, 1) - offset),
    end: new Date(Date.UTC(year, month, 1) - offset),
  };
}

export type FinanceExportRecord = {
  referenceNumber: string;
  receiptNumber: string | null;
  status: string;
  givingIntent: string;
  paymentMethod: string;
  currency: string;
  amount: Prisma.Decimal;
  refundedAmount: Prisma.Decimal;
  capturedAt: Date | null;
  refundedAt: Date | null;
};

const CSV_HEADER = [
  "reference_number", "receipt_number", "giving_intent", "payment_method",
  "status", "currency", "gross_inr", "refunded_inr", "net_inr",
  "captured_at_utc", "refunded_at_utc",
].join(",");

function safeCsvText(value: string | null): string {
  const normalized = (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ");
  const safe = /^[\s]*[=+@-]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** This export is an internal reconciliation snapshot, not a tax certificate. */
export function serializeFinanceCsv(records: readonly FinanceExportRecord[]): string {
  if (records.length > MAX_FINANCE_EXPORT_ROWS) throw new Error("Finance export row limit exceeded");

  const output = [CSV_HEADER];
  for (const record of records) {
    const net = record.amount.minus(record.refundedAmount);
    if (record.amount.isNeg() || record.refundedAmount.isNeg() || net.isNeg()) {
      throw new Error("Invalid finance reconciliation amount");
    }
    output.push([
      safeCsvText(record.referenceNumber),
      safeCsvText(record.receiptNumber),
      safeCsvText(record.givingIntent),
      safeCsvText(record.paymentMethod),
      safeCsvText(record.status),
      safeCsvText(record.currency),
      record.amount.toFixed(2),
      record.refundedAmount.toFixed(2),
      net.toFixed(2),
      safeCsvText(record.capturedAt?.toISOString() ?? null),
      safeCsvText(record.refundedAt?.toISOString() ?? null),
    ].join(","));
  }
  return "\uFEFF" + output.join("\r\n") + "\r\n";
}
