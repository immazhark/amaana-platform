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
