import { Prisma } from "@prisma/client";

type DocumentScope = { id: string; assistanceRequestId: string };
type EvidenceRow = {
  documentId: string; entityId: string; conflict: boolean;
  holdAction: string | null; holdAt: Date | null; holdActor: string | null;
  reviewAt: Date | null; reviewActor: string | null; reviewReason: string | null; reviewAfter: unknown;
  decisionAction: string | null; decisionAfter: unknown;
};

/** A cross-case hold or an ambiguous latest hold is inconsistent evidence, never permission to act. */
export async function loadRetentionPageEvidence(client: Pick<Prisma.TransactionClient, "$queryRaw">, documents: readonly DocumentScope[]) {
  const scopes = new Map(documents.map(document => [document.id, document.assistanceRequestId]));
  if (!scopes.size) return new Map<string, EvidenceRow>();
  if (scopes.size !== documents.length || scopes.size > 50) throw new Error("Invalid retention page scope");
  const rows = await client.$queryRaw<EvidenceRow[]>`
    SELECT d.id AS "documentId", d."assistanceRequestId" AS "entityId",
      (EXISTS (
        SELECT 1 FROM "AuditEvent" a WHERE a."entityType" = 'AssistanceRequest'
          AND a.metadata->>'documentId' = d.id AND a."entityId" <> d."assistanceRequestId"
          AND a.action IN ('assistance.document_legal_hold_placed', 'assistance.document_legal_hold_released')
      ) OR EXISTS (
        SELECT 1 FROM "AuditEvent" a WHERE a."entityType" = 'AssistanceRequest'
          AND a."entityId" = d."assistanceRequestId" AND a.metadata->>'documentId' = d.id
          AND a.action IN ('assistance.document_legal_hold_placed', 'assistance.document_legal_hold_released')
          AND a."createdAt" = h."createdAt" AND a.action <> h.action
      )) AS conflict,
      h.action AS "holdAction", h."createdAt" AS "holdAt", hu.name AS "holdActor",
      r."createdAt" AS "reviewAt", ru.name AS "reviewActor",
      CASE WHEN jsonb_typeof(r.metadata->'reason') = 'string' THEN r.metadata->>'reason' END AS "reviewReason",
      r.metadata->'reviewAfter' AS "reviewAfter",
      v.action AS "decisionAction", v.metadata->'reviewAfter' AS "decisionAfter"
    FROM "AssistanceDocument" d
    LEFT JOIN LATERAL (
      SELECT a.action, a."createdAt", a."actorId" FROM "AuditEvent" a
      WHERE a."entityType" = 'AssistanceRequest' AND a."entityId" = d."assistanceRequestId"
        AND a.metadata->>'documentId' = d.id
        AND a.action IN ('assistance.document_legal_hold_placed', 'assistance.document_legal_hold_released')
      ORDER BY a."createdAt" DESC, a.id DESC LIMIT 1
    ) h ON true
    LEFT JOIN "User" hu ON hu.id = h."actorId"
    LEFT JOIN LATERAL (
      SELECT a."createdAt", a."actorId", a.metadata FROM "AuditEvent" a
      WHERE a."entityType" = 'AssistanceRequest' AND a."entityId" = d."assistanceRequestId"
        AND a.metadata->>'documentId' = d.id AND a.action = 'assistance.document_retention_reviewed'
      ORDER BY a."createdAt" DESC, a.id DESC LIMIT 1
    ) r ON true
    LEFT JOIN "User" ru ON ru.id = r."actorId"
    LEFT JOIN LATERAL (
      SELECT a.action, a.metadata FROM "AuditEvent" a
      WHERE a."entityType" = 'AssistanceRequest' AND a."entityId" = d."assistanceRequestId"
        AND a.metadata->>'documentId' = d.id
        AND a.action IN ('assistance.document_retention_reviewed', 'assistance.document_legal_hold_placed', 'assistance.document_legal_hold_released')
      ORDER BY a."createdAt" DESC, a.id DESC LIMIT 1
    ) v ON true
    WHERE d.id IN (${Prisma.join([...scopes.keys()])})
  `;
  const result = new Map<string, EvidenceRow>();
  for (const row of rows) {
    if (!scopes.has(row.documentId) || scopes.get(row.documentId) !== row.entityId || result.has(row.documentId) || typeof row.conflict !== "boolean") throw new Error("Inconsistent retention page evidence");
    result.set(row.documentId, row);
  }
  if (result.size !== scopes.size) throw new Error("Incomplete retention page evidence");
  return result;
}
