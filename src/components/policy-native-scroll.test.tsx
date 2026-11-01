import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import DonationPolicyPage from "@/app/donation-policy/page";
import RefundPolicyPage from "@/app/refund-policy/page";

test.each([
  ["privacy", PrivacyPage],
  ["terms", TermsPage],
  ["donation-policy", DonationPolicyPage],
  ["refund-policy", RefundPolicyPage],
] as const)("%s keeps its independently scrollable table of contents browser-owned", (_route, Page) => {
  const html = renderToStaticMarkup(<Page />);
  const sidebars = [...html.matchAll(/<aside\b([^>]*)>([\s\S]*?)<\/aside>/g)];
  const navigation = sidebars.filter(([, , body]) => body.includes('aria-label="On this page"'));
  expect(navigation).toHaveLength(1);
  expect(navigation[0][1]).toMatch(/\bdata-native-scroll(?:="[^"]*")?(?:\s|$)/);
  expect(navigation[0][2]).toContain('href="#policy-01"');
});
