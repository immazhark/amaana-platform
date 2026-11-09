import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import ts from "typescript";

describe("direct transfer late navigation", () => {
  it.each([true, false])("navigates only while original form connected=%s", async connected => {
    const source = readFileSync(new URL("./direct-transfer-form.tsx", import.meta.url), "utf8");
    const tree = ts.createSourceFile("form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let handler: ts.FunctionDeclaration | undefined;
    function visit(n: ts.Node) { if (ts.isFunctionDeclaration(n) && n.name?.text === "submit") handler = n; ts.forEachChild(n, visit); }
    visit(tree);
    if (!handler) throw new Error("Missing actual submit handler");
    const js = ts.transpile(handler.getText(tree), { target: ts.ScriptTarget.ES2022 });
    const push = vi.fn();
    let resolve: (value: unknown) => void = () => { throw new Error("No pending request"); };
    const request = vi.fn(() => new Promise(yes => { resolve = yes; }));
    class SyntheticFormData { values = new Map<string, unknown>(); get(k: string) { return this.values.get(k) ?? null; } set(k: string, v: unknown) { this.values.set(k, v); } }
    const lock = vi.fn();
    const run = new Function("submissionRef", "onLockChange", "setError", "setBusy", "setUncertain", "FormData", "donationEvidenceUploadIssue", "hasValidDonationEvidenceHeader", "appealId", "method", "fetch", "router", "privateDonationAcknowledgementPath", js + "; return submit;");
    const submit = run({ current: false }, lock, vi.fn(), vi.fn(), vi.fn(), SyntheticFormData, () => null, () => true, "synthetic-appeal", "BANK_TRANSFER", request, { push }, () => "/synthetic-ack") as (event: unknown) => Promise<void>;
    const form = { isConnected: true };
    const pending = submit({ preventDefault: vi.fn(), currentTarget: form });
    expect(request).toHaveBeenCalledTimes(1);
    form.isConnected = connected;
    resolve({ status: 202, ok: true, json: async () => ({ status: "PENDING_VERIFICATION", referenceNumber: "AFD-SYNTHETIC", receiptToken: "synthetic_token_1234567890" }) });
    await pending;
    expect(push).toHaveBeenCalledTimes(connected ? 1 : 0);
    expect(request).toHaveBeenCalledTimes(1);
    expect(lock.mock.calls).toEqual([[true]]);
  });
});
