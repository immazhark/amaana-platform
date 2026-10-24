import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/get-involved/sponsor-education" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: () => null }));
import { FooterNavGroup } from "./footer-nav-group";
import { SiteHeader } from "./site-header";

it("announces only the actual footer destination as the current page", () => {
  route.pathname = "/get-involved/sponsor-education";
  const html = renderToStaticMarkup(<FooterNavGroup label="Take part"><a href="/get-involved">Get Involved</a><a href="/get-involved/sponsor-education">Sponsor Education</a></FooterNavGroup>);
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html).toContain('href="/get-involved/sponsor-education" aria-current="page"');
  expect(html).not.toContain('href="/get-involved" aria-current="page"');
});

it("does not call a footer parent the current page when no exact destination exists", () => {
  route.pathname = "/contact/feedback";
  const html = renderToStaticMarkup(<FooterNavGroup label="Contact"><a href="/contact">Contact</a></FooterNavGroup>);
  expect(html).not.toContain('aria-current="page"');
});

it("retains the header section highlight without announcing its parent as the current page", () => {
  route.pathname = "/get-involved/sponsor-education";
  const html = renderToStaticMarkup(<SiteHeader />);
  const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]);
  const parents = anchors.filter(anchor => anchor.includes('href="/get-involved"'));
  expect(parents).toHaveLength(2);
  for (const parent of parents) {
    expect(parent).toContain('aria-current="location"');
    expect(parent).toMatch(/class="[^"]*active/);
  }
});

it("still announces an exact header destination as the current page", () => {
  route.pathname = "/get-involved";
  const html = renderToStaticMarkup(<SiteHeader />);
  const parents = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).filter(anchor => anchor.includes('href="/get-involved"'));
  expect(parents).toHaveLength(2);
  for (const parent of parents) expect(parent).toContain('aria-current="page"');
});
