import "server-only";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import sitemap from "@/app/sitemap";
import { INDEXNOW_ENDPOINT, buildIndexNowUrlList, getIndexNowConfiguration, parseIndexNowPaths } from "@/lib/indexnow";

export type IndexNowResult = {
  state: "received" | "validation_pending" | "rejected" | "unknown" | "throttled";
  count: number;
  auditRecorded: boolean;
};

/** Explicit, authorized staff operation only. No cron, publication hook or
 * automatic retry; provider receipt is never proof of search indexing.
 * Audit admission is committed BEFORE outbound work and limits concurrent
 * submissions per staff account to one per minute, including unknown outcomes.
 */
export async function submitIndexNowPaths(actorId: string, input: unknown): Promise<IndexNowResult> {
  const config = getIndexNowConfiguration();
  if (!config) throw new Error("Search discovery is disabled or incompletely configured.");
  const paths = parseIndexNowPaths(input);
  const urls = buildIndexNowUrlList(paths, await sitemap(), config);
  const attempt = await withSerializableTransactionRetry(async tx => {
    const recent = await tx.auditEvent.findFirst({
      where: { actorId, action: "INDEXNOW_SUBMISSION_ATTEMPTED", entityType: "SearchDiscovery",
        entityId: config.host, createdAt: { gte: new Date(Date.now() - 60_000) } },
      select: { id: true },
    });
    if (recent) return null;
    return tx.auditEvent.create({
      data: { actorId, action: "INDEXNOW_SUBMISSION_ATTEMPTED", entityType: "SearchDiscovery",
        entityId: config.host, metadata: { count: urls.length } }, select: { id: true },
    });
  });
  if (!attempt) return { state: "throttled", count: 0, auditRecorded: true };

  let state: IndexNowResult["state"] = "unknown";
  let status: number | null = null;
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: config.host, key: config.key,
        keyLocation: `${config.origin}/${config.key}.txt`, urlList: urls }),
      cache: "no-store", redirect: "error", credentials: "omit", signal: AbortSignal.timeout(5_000),
    });
    status = response.status;
    state = status === 200 ? "received" : status === 202 ? "validation_pending"
      : [400, 403, 422, 429].includes(status) ? "rejected" : "unknown";
    // Only status is needed. Never read, retain or display provider bodies.
    try { void response.body?.cancel().catch(() => undefined); } catch { /* best effort */ }
  } catch { /* Delivery can have succeeded before a timeout: do not retry automatically. */ }

  let auditRecorded = true;
  try {
    await prisma.auditEvent.create({
      data: { actorId, action: "INDEXNOW_SUBMISSION_RESULT", entityType: "SearchDiscovery",
        entityId: attempt.id, metadata: { count: urls.length, providerStatus: status, outcome: state } },
    });
  } catch { auditRecorded = false; }
  return { state, count: urls.length, auditRecorded };
}
