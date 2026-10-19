import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FINANCE_EXPORT_ROW_LIMIT,
  financeMonthBounds,
  serializeFinanceCsv,
} from "@/lib/finance-monthly-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      ...privateHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/** Export a current reconciliation snapshot, never a statutory tax filing. */
export async function GET(request: Request) {
  const user = await requirePermission("donation.reconcile");
  const months = new URL(request.url).searchParams.getAll("month");
  const month = months.length === 1 ? financeMonthBounds(months[0] ?? "") : null;
  if (!month) return errorResponse("Choose one valid YYYY-MM month.", 400);

  try {
    const records = await prisma.donation.findMany({
      where: {
        status: { in: ["CAPTURED", "REFUNDED"] },
        capturedAt: { gte: month.start, lt: month.end },
      },
      orderBy: [{ capturedAt: "asc" }, { id: "asc" }],
      take: FINANCE_EXPORT_ROW_LIMIT + 1,
      select: {
        referenceNumber: true,
        receiptNumber: true,
        givingIntent: true,
        paymentMethod: true,
        status: true,
        currency: true,
        amount: true,
        refundedAmount: true,
        capturedAt: true,
        refundedAt: true,
      },
    });

    if (records.length > FINANCE_EXPORT_ROW_LIMIT) {
      return errorResponse("This month exceeds the export limit. Contact an administrator.", 413);
    }

    const csv = serializeFinanceCsv(records);
    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "donation.finance_export",
        entityType: "DonationFinanceMonth",
        entityId: month.month,
        metadata: { rowCount: records.length, scope: "internal-reconciliation" },
      },
    });

    return new Response(csv, {
      status: 200,
      headers: {
        ...privateHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="amaana-internal-finance-${month.month}.csv"`,
      },
    });
  } catch {
    return errorResponse("Finance export unavailable.", 503);
  }
}
