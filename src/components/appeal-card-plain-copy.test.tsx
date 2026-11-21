import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AppealCard } from "./appeal-card";

vi.mock("@/components/work-visual-placeholder", () => ({ WorkVisualPlaceholder: () => null }));

it("shows an appeal summary typed with Markdown emphasis as plain words", () => {
  const html = renderToStaticMarkup(<AppealCard appeal={{
    slug: "synthetic-plain-copy", title: "Synthetic appeal", summary: "Needs **₹8 lakh** for *treatment*.",
    category: "MEDICAL", beneficiaryLocation: null, goalAmount: 1000, amountRaised: 250,
  }} />);
  expect(html).toContain("Needs ₹8 lakh for treatment.");
  expect(html).not.toContain("*");
});
