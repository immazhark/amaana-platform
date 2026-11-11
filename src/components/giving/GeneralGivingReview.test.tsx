import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { GeneralGivingReview } from "./GeneralGivingReview";
import { validateGivingProposal, validateProviderCapability } from "@/lib/giving-foundation";

const generalProposal = {
  fund: { id: "general", status: "ACTIVE" as const, eligibleIntents: ["GENERAL"] as const },
  policy: { id: "general-v1", fundId: "general", status: "ACTIVE" as const, evidenceRef: "review-case-001" },
  price: { id: "price-100", policyId: "general-v1", status: "ACTIVE" as const, amountPaise: 10000 },
  intent: "GENERAL",
  amountPaise: 10000,
};

const capability = {
  accountId: "domestic-inr",
  environment: "TEST" as const,
  method: "RAZORPAY" as const,
  frequency: "ONE_TIME" as const,
  currency: "INR" as const,
  enabled: true,
};

describe("six synthetic general giving journey decisions", () => {
  it.each([
    { title: "matching general one-time test capability", proposal: generalProposal, capability, environment: "TEST", allowed: true },
    { title: "closed fund", proposal: { ...generalProposal, fund: { ...generalProposal.fund, status: "CLOSED" } }, capability, environment: "TEST", allowed: false },
    { title: "policy points to another fund", proposal: { ...generalProposal, policy: { ...generalProposal.policy, fundId: "another" } }, capability, environment: "TEST", allowed: false },
    { title: "unreviewed price policy", proposal: { ...generalProposal, price: { ...generalProposal.price, policyId: "another" } }, capability, environment: "TEST", allowed: false },
    { title: "unapproved religious purpose", proposal: { ...generalProposal, intent: "ZAKAT" }, capability, environment: "TEST", allowed: false },
    { title: "environment mismatch", proposal: generalProposal, capability, environment: "LIVE", allowed: false },
  ])("$title", ({ proposal, capability: config, environment, allowed }) => {
    const proposalAllowed = validateGivingProposal(proposal);
    const capabilityAllowed = validateProviderCapability(config, {
      accountId: "domestic-inr",
      environment,
      method: "RAZORPAY",
      frequency: "ONE_TIME",
      currency: "INR",
    });
    expect(proposalAllowed && capabilityAllowed).toBe(allowed);
  });
});

describe("GeneralGivingReview", () => {
  it("renders a non-collecting labelled review, without checkout or donor fields", () => {
    const html = renderToStaticMarkup(createElement(GeneralGivingReview, { proposal: generalProposal }));
    expect(html).toContain("General giving");
    expect(html).toContain("₹100.00");
    expect(html).toContain("<summary");
    expect(html).toContain("Review details");
    expect(html).toContain("This is a review only");
    expect(html).not.toMatch(/<form\b|<input\b|<button\b|<iframe\b/i);
    expect(html).not.toMatch(/razorpay\.open|paymentLink|donorEmail/i);
  });

  it("fails closed and shows no amount for a rejected policy or missing proposal", () => {
    for (const proposal of [{ ...generalProposal, policy: { ...generalProposal.policy, evidenceRef: "" } }, null]) {
      const html = renderToStaticMarkup(createElement(GeneralGivingReview, { proposal }));
      expect(html).toContain("not available for review");
      expect(html).not.toContain("₹100.00");
      expect(html).not.toMatch(/<form\b|<input\b|<button\b/i);
    }
  });
});
