import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), submit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("@/lib/indexnow-submission", () => ({ submitIndexNowPaths: m.submit }));
import { submitIndexNowAction } from "./indexnow-action";
import { IndexNowInputError } from "@/lib/indexnow";
import { AdminIndexNowSubmission } from "@/components/admin-indexnow-submission";
const initial = { state: "idle" as const, message: "" };
function form(confirmed = true) { const data = new FormData(); data.set("paths", "/about"); if (confirmed) data.set("confirmPublic", "true"); return data; }
describe("authorized explicit search notifications", () => {
  beforeEach(() => { vi.resetAllMocks(); m.permission.mockResolvedValue({ id: "approver" }); m.submit.mockResolvedValue({ state: "received", count: 1, auditRecorded: true }); });
  it("requires independent content publication authority before dispatch", async () => {
    await submitIndexNowAction(initial, form()); expect(m.permission).toHaveBeenCalledWith("content.approve"); expect(m.submit).toHaveBeenCalledWith("approver", "/about");
  });
  it("preserves auth redirects and does not dispatch for unauthorized callers", async () => { m.permission.mockRejectedValue(new Error("Forbidden")); await expect(submitIndexNowAction(initial, form())).rejects.toThrow("Forbidden"); expect(m.submit).not.toHaveBeenCalled(); });
  it("requires explicit search-discovery confirmation", async () => { expect((await submitIndexNowAction(initial, form(false))).state).toBe("error"); expect(m.submit).not.toHaveBeenCalled(); });
  it("distinguishes receipt from pending ownership validation", async () => { m.submit.mockResolvedValue({ state: "validation_pending", count: 1, auditRecorded: true }); const r = await submitIndexNowAction(initial, form()); expect(r.message).toContain("ownership validation remains pending"); expect(r.message).toContain("does not guarantee"); });
  it("retains an uncertain outcome without suggesting an immediate retry", async () => { m.submit.mockResolvedValue({ state: "unknown", count: 1, auditRecorded: true }); const r = await submitIndexNowAction(initial, form()); expect(r.state).toBe("uncertain"); expect(r.message).toContain("may have received"); });
  it("reports a missing outcome audit without misreporting delivery", async () => { m.submit.mockResolvedValue({ state: "received", count: 1, auditRecorded: false }); const r = await submitIndexNowAction(initial, form()); expect(r.state).toBe("success"); expect(r.message).toContain("outcome audit could not be saved"); });
  it.each(["rejected", "throttled"])("keeps %s outcomes visible", async state => { m.submit.mockResolvedValue({ state, count: 0, auditRecorded: true }); expect((await submitIndexNowAction(initial, form())).state).toBe("error"); });
  it("returns bounded domain errors and hides arbitrary internal details", async () => { m.submit.mockRejectedValue(new IndexNowInputError("A selected page is absent")); expect((await submitIndexNowAction(initial, form())).message).toBe("A selected page is absent"); m.submit.mockRejectedValue(new Error("private database string")); expect((await submitIndexNowAction(initial, form())).message).not.toContain("private database string"); });
  it("renders bounded labelled fields and an affirmative opt-in without a key or receipt form", () => { const html = renderToStaticMarkup(createElement(AdminIndexNowSubmission)); expect(html).toContain('for="indexnow-paths"'); expect(html).toContain('name="confirmPublic"'); expect(html).toContain('maxLength="12000"'); expect(html).not.toContain('name="key"'); expect(html).not.toContain('name="token"'); });
});
