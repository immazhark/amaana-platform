import type { Prisma } from "@prisma/client";

// Only the application's non-secret donation reference, never a receipt token, bank reference or contact detail.
export function donationReviewFilters(reference: unknown, sort: unknown) {
  const normalized = typeof reference === "string" ? reference.trim().toUpperCase() : "";
  const valid = /^AFD-\d{4}-\d{8}$/.test(normalized);
  return {
    reference: valid ? normalized : null,
    invalidReference: reference !== undefined && reference !== "" && !valid,
    direction: sort === "oldest" ? "asc" as const : "desc" as const,
  };
}

const methods = ["DIRECT_UPI", "BANK_TRANSFER"] as const;
const fields = ["underDay", "oneToSevenDays", "overSevenDays", "future", "total"] as const;
type Method = (typeof methods)[number];
type Counts = Record<(typeof fields)[number], number>;
export type PendingTransferRow = Counts & { paymentMethod: Method };
type Raw = Record<(typeof fields)[number], bigint> & { paymentMethod: string };
const day = 86_400_000;

/** Age since the claim was submitted, not the bank transfer date or a promised verification time. */
export async function loadPendingTransferReview(client: Pick<Prisma.TransactionClient, "$queryRaw">, now = new Date()): Promise<PendingTransferRow[]> {
  const oneDay = new Date(now.getTime() - day);
  const sevenDays = new Date(now.getTime() - 7 * day);
  const rows = await client.$queryRaw<Raw[]>`
    SELECT CAST("paymentMethod" AS TEXT) AS "paymentMethod",
      COUNT(CASE WHEN "createdAt" > ${oneDay} AND "createdAt" <= ${now} THEN 1 END) AS "underDay",
      COUNT(CASE WHEN "createdAt" <= ${oneDay} AND "createdAt" >= ${sevenDays} THEN 1 END) AS "oneToSevenDays",
      COUNT(CASE WHEN "createdAt" < ${sevenDays} THEN 1 END) AS "overSevenDays",
      COUNT(CASE WHEN "createdAt" > ${now} THEN 1 END) AS "future",
      COUNT(*) AS "total"
    FROM "Donation"
    WHERE "status" = 'PENDING_VERIFICATION' AND "paymentMethod" IN ('DIRECT_UPI', 'BANK_TRANSFER')
    GROUP BY "paymentMethod"
  `;
  const byMethod = new Map<Method, PendingTransferRow>();
  for (const row of rows) {
    const method = methods.find(item => item === row.paymentMethod);
    const counts = Object.fromEntries(fields.map(field => [field, Number(row[field])])) as Counts;
    if (!method || byMethod.has(method) || fields.some(field => !Number.isSafeInteger(counts[field]) || counts[field] < 0) ||
      counts.total !== counts.underDay + counts.oneToSevenDays + counts.overSevenDays + counts.future) {
      throw new Error("Inconsistent pending transfer review");
    }
    byMethod.set(method, { paymentMethod: method, ...counts });
  }
  return methods.map(paymentMethod => byMethod.get(paymentMethod) ?? { paymentMethod, underDay: 0, oneToSevenDays: 0, overSevenDays: 0, future: 0, total: 0 });
}
