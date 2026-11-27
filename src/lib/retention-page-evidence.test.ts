import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { loadRetentionPageEvidence } from "./retention-page-evidence";

const docs = [{ id: "doc-a", assistanceRequestId: "case-a" }];
const row = { documentId: "doc-a", entityId: "case-a", conflict: false, holdAction: null, holdAt: null, holdActor: null, reviewAt: null, reviewActor: null, reviewReason: null, reviewAfter: null, decisionAction: null, decisionAfter: null };
const client = (rows: unknown[]) => { const query = vi.fn(async () => rows); return { query, db: { $queryRaw: query } as unknown as Pick<Prisma.TransactionClient, "$queryRaw"> }; };
describe("bounded retention evidence", () => {
  it("makes no read for an empty page and refuses oversized or duplicate scope", async () => {
    const { db, query } = client([]);
    expect(await loadRetentionPageEvidence(db, [])).toEqual(new Map());
    await expect(loadRetentionPageEvidence(db, [...docs, ...docs])).rejects.toThrow();
    await expect(loadRetentionPageEvidence(db, Array.from({ length: 51 }, (_, i) => ({ id: String(i), assistanceRequestId: "case" })))).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });
  it("returns one current evidence record per document and preserves conflicts", async () => {
    const { db, query } = client([{ ...row, conflict: true }]);
    const result = await loadRetentionPageEvidence(db, docs);
    expect(result.get("doc-a")?.conflict).toBe(true);
    expect(query).toHaveBeenCalledOnce();
  });
  it("refuses incomplete, duplicate or out-of-scope evidence", async () => {
    for (const rows of [[{ ...row, entityId: "foreign-case" }], [row, row], [], [{ ...row, documentId: "foreign-doc" }]]) {
      await expect(loadRetentionPageEvidence(client(rows).db, docs)).rejects.toThrow();
    }
  });
});
