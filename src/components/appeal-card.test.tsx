import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealCard } from "./appeal-card";
import type { PublicAppeal } from "@/lib/appeals";

const record: PublicAppeal = {
  slug: "synthetic-reviewed-need", title: "Reviewed family assistance",
  summary: "Approved, private-safe published context", category: "MEDICAL",
  beneficiaryLocation: null, goalAmount: 500.01, amountRaised: 100.3,
  closesAt: null,
};
describe("public funding card financial integrity", () => {
  it("renders exact INR paise with a consistently accessible progress meter", () => {
    const html = renderToStaticMarkup(<AppealCard appeal={record}/>);
    expect(html).toContain("₹100.30");
    expect(html).toContain("₹500.01");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="20"');
    expect(html).toContain("Location withheld");
    expect(html).toContain("/appeals/synthetic-reviewed-need");
  });
  it("does not advertise progress or a rounded fundraising target for invalid ledger data", () => {
    const html = renderToStaticMarkup(<AppealCard appeal={{ ...record, amountRaised: 100.301 }}/>);
    expect(html).toContain("Financial figures are under reconciliation");
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain("₹100");
  });
});
