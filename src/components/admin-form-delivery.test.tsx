import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it, vi } from "vitest";
const ui = vi.hoisted(() => ({ pending: false, error: false }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(), useActionState: (action: unknown, initial: object) => [{ ...initial, ...(ui.error ? { ...("status" in initial ? { status: "error" } : { state: "error" }), message: "Synthetic review error" } : {}) }, action, ui.pending] }));
vi.mock("react-dom", async original => ({ ...await original<typeof import("react-dom")>(), useFormStatus: () => ({ pending: ui.pending }) }));
vi.mock("@/app/admin/(protected)/donations/actions", () => ({ reconcileDonationAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/allocations/actions", () => ({ createAllocationAction: vi.fn(), reverseAllocationAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/donations/rights/actions", () => ({ reviewDonorRightsAction: vi.fn() }));
import { AdminDirectTransferForm } from "./admin-direct-transfer-form";
import { AllocationProposalForm } from "./admin-allocation-proposal-form";
import { AdminAllocationReversal } from "./admin-allocation-reversal";
import { AdminDonorRightsReview } from "./admin-donor-rights-review";
const cases = [
  ["transfer", () => createElement(AdminDirectTransferForm, { donationId: "synthetic-donation" })],
  ["proposal", () => createElement(AllocationProposalForm, { donationId: "synthetic-donation" })],
  ["reversal", () => createElement(AdminAllocationReversal, { proposalId: "synthetic-proposal" })],
  ["rights-open", () => createElement(AdminDonorRightsReview, { requestId: "synthetic-request", status: "OPEN" })],
  ["rights-review", () => createElement(AdminDonorRightsReview, { requestId: "synthetic-request", status: "IN_REVIEW" })],
] as const;
// Attribute order has no effect on form behavior or accessible markup.
function canonicalMarkup(html: string) {
  return html.replace(/<[A-Za-z](?:[^"'<>]|"[^"]*"|'[^']*')*>/g, tag => {
    const tokens = tag.slice(1, -1).match(/[^\s=]+(?:="[^"]*"|='[^']*')?/g) ?? [];
    return `<${tokens[0]} ${tokens.slice(1).sort().join(" ")}>`;
  });
}
const captured: Record<string, string> = {};
afterAll(() => { if (process.env.AMAANA_ADMIN_FORM_CAPTURE) writeFileSync(process.env.AMAANA_ADMIN_FORM_CAPTURE, JSON.stringify(captured)); });
describe("staff form delivery preserves review controls and feedback", () => {
  for (const [name, element] of cases) for (const mode of ["idle", "pending", "error"] as const) {
    it(`${name} preserves ${mode} markup`, () => {
      ui.pending = mode === "pending"; ui.error = mode === "error";
      const html = renderToStaticMarkup(element()); captured[`${name}:${mode}`] = html;
      expect(html).toContain(`aria-busy="${ui.pending}"`);
      const buttons = html.match(/<button\b[^>]*>/g) ?? [];
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons.every(button => /\bdisabled=""/.test(button) === ui.pending)).toBe(true);
      if (ui.error) { expect(html).toContain('role="alert"'); expect(html).toContain("Synthetic review error"); }
      if (name === "transfer") { expect(html).toContain('formNoValidate=""'); expect(html).toContain('name="statementConfirmed"'); expect(html).toContain('name="statementAmount"'); }
      if (name === "rights-review") { expect(html).toContain('name="reviewConfirmed"'); expect(html).toContain('name="resolution"'); }
      if (process.env.AMAANA_ADMIN_FORM_BASELINE) expect(canonicalMarkup(html)).toBe(canonicalMarkup(JSON.parse(readFileSync(process.env.AMAANA_ADMIN_FORM_BASELINE, "utf8"))[`${name}:${mode}`]));
    });
  }
});
