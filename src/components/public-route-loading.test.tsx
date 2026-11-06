import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicRouteLoading } from "./public-route-loading";

const routes = [
  ["stories", "Stories of Amanah", "Loading published stories"],
  ["our-work", "Our Work", "Loading published initiatives"],
  ["impact", "Our Impact", "Loading documented outcomes"],
  ["appeals", "Verified Appeals", "Checking current public appeals"],
  ["faith-and-reflections", "Faith & Reflections", "Loading the reviewed library"],
] as const;

it.each(routes)("renders a public-safe loading status for %s", (route, title, message) => {
  const html = renderToStaticMarkup(<PublicRouteLoading route={route} />);
  expect(html).toContain(`<h1`);
  expect(html).toContain(title.replace("&", "&amp;"));
  expect(html).toContain(message);
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).not.toMatch(/<main\b|<button\b|<a\b|<img\b|<video\b/);
  expect(html).not.toMatch(/beneficiar(?:y|ies)|donor|raised|funded|\b₹\s*\d/i);
});

// AF-R071: A dynamic donation landing page must not show an empty transition
// or promise a payment destination before current eligibility is checked.
it("AF-R071 donation loading is accessible, nontransactional, and wired", () => {
  const html = renderToStaticMarkup(<PublicRouteLoading route="donate" />);
  expect(html).toContain("Domestic Donations");
  expect(html).toContain("Checking currently approved giving routes");
  // AF-R071 browser RED: loading must preserve the shared hero and body shell
  // while the per-request donation eligibility projection is unresolved.
  expect(html).toContain('class="page-hero__shell"');
  expect(html).toContain("canonical-body");
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).not.toMatch(/<main\\b|<button\\b|<a\\b|<img\\b|<video\\b|\\b₹\\s*\\d/i);
});
